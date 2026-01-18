/**
 * Engine Service - Handles Stockfish engine communication
 */

import type {
  Depth,
  EngineConfig,
  EngineEvent,
  EngineEventListener,
  EngineState,
  FENString,
  Score,
  UCIMove,
} from '@/types';
import { DEFAULT_ENGINE_CONFIG } from '@/types';

/**
 * Engine Service - Manages Stockfish web worker
 */
const ANALYSIS_TIMEOUT = 10000; // 10 seconds max

export class EngineService {
  private worker: Worker | null = null;
  private state: EngineState = 'idle';
  private config: EngineConfig;
  private listeners: Set<EngineEventListener> = new Set();
  private currentBestMove: UCIMove | null = null;
  private currentScore: Score | null = null;
  private currentDepth: Depth = 0;
  private analysisTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
  }

  /**
   * Initialize the Stockfish engine
   * Uses our bundled Stockfish via blob URL workaround for MV3
   */
  public initialize(): boolean {
    // Try bundled engine first (most reliable)
    if (this.tryBundledEngine()) {
      return true;
    }

    console.error('[EngineService] Failed to initialize engine');
    this.state = 'error';
    this.emit({ type: 'error', data: new Error('No engine available') });
    return false;
  }

  /**
   * Try to use our bundled Stockfish engine via blob URL workaround
   */
  private tryBundledEngine(): boolean {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) {
        console.log('[EngineService] Not in extension context');
        return false;
      }

      const workerUrl = chrome.runtime.getURL(this.config.workerPath);
      const wasmUrl = chrome.runtime.getURL('engine/stockfish.wasm');
      console.log('[EngineService] Loading bundled engine from:', workerUrl);

      // Fetch the worker script
      const jsXhr = new XMLHttpRequest();
      jsXhr.open('GET', workerUrl, false);
      jsXhr.send();

      if (jsXhr.status !== 200) {
        console.error('[EngineService] Failed to fetch worker script:', jsXhr.status);
        return false;
      }

      // Fetch the WASM binary
      const wasmXhr = new XMLHttpRequest();
      wasmXhr.open('GET', wasmUrl, false);
      wasmXhr.responseType = 'arraybuffer';
      wasmXhr.send();

      if (wasmXhr.status !== 200) {
        console.error('[EngineService] Failed to fetch WASM:', wasmXhr.status);
        return false;
      }

      // Convert WASM to base64 for embedding
      const wasmBytes = new Uint8Array(wasmXhr.response);
      let wasmBase64 = '';
      const chunkSize = 32768;
      for (let i = 0; i < wasmBytes.length; i += chunkSize) {
        const chunk = wasmBytes.subarray(i, Math.min(i + chunkSize, wasmBytes.length));
        wasmBase64 += String.fromCharCode.apply(null, Array.from(chunk));
      }
      wasmBase64 = btoa(wasmBase64);

      // Create wrapper that provides the WASM binary directly
      const wrapper = `
        var wasmBinaryBase64 = "${wasmBase64}";
        var wasmBinary = Uint8Array.from(atob(wasmBinaryBase64), c => c.charCodeAt(0));
        var Module = {
          wasmBinary: wasmBinary.buffer,
          locateFile: function(path) { return path; }
        };
        ${jsXhr.responseText}
      `;

      const blob = new Blob([wrapper], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);

      this.worker = new Worker(blobUrl);
      this.setupMessageHandler();
      this.worker.postMessage('uci');
      this.state = 'idle';
      this.emit({ type: 'ready', data: null });
      console.log('[EngineService] Successfully loaded bundled engine via blob');
      return true;
    } catch (error) {
      console.error('[EngineService] Bundled engine failed:', error);
      return false;
    }
  }

  /**
   * Start analyzing a position
   */
  public analyze(fen: FENString, depth?: Depth): void {
    if (!this.worker) {
      console.error('[EngineService] Worker not initialized');
      return;
    }

    // Clear any existing timeout
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
    }

    const analysisDepth = depth ?? this.config.defaultDepth;
    this.state = 'analyzing';
    this.currentBestMove = null;
    this.currentScore = null;
    this.currentDepth = 0;

    console.log('[EngineService] Starting analysis, depth:', analysisDepth);
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${analysisDepth}`);

    // Set timeout to force completion if engine takes too long
    this.analysisTimeout = setTimeout(() => {
      if (this.state === 'analyzing' && this.currentBestMove) {
        console.log('[EngineService] Timeout reached, using current best move');
        this.state = 'idle';
        this.emit({
          type: 'bestmove',
          data: {
            bestMove: this.currentBestMove,
            score: this.currentScore,
            depth: this.currentDepth,
            pv: [this.currentBestMove],
          },
        });
      }
    }, ANALYSIS_TIMEOUT);
  }

  /**
   * Start quick analysis for auto-play
   */
  public analyzeQuick(fen: FENString): void {
    this.analyze(fen, this.config.autoPlayDepth);
  }

  /**
   * Stop current analysis
   */
  public stop(): void {
    if (this.worker && this.state === 'analyzing') {
      this.worker.postMessage('stop');
      this.state = 'stopped';
    }
  }

  /**
   * Terminate the engine
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.state = 'idle';
    }
  }

  /**
   * Get current state
   */
  public getState(): EngineState {
    return this.state;
  }

  /**
   * Get current best move
   */
  public getBestMove(): UCIMove | null {
    return this.currentBestMove;
  }

  /**
   * Get current score
   */
  public getScore(): Score | null {
    return this.currentScore;
  }

  /**
   * Get current analysis depth
   */
  public getDepth(): Depth {
    return this.currentDepth;
  }

  /**
   * Subscribe to engine events
   */
  public subscribe(listener: EngineEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Setup message handler for worker
   */
  private setupMessageHandler(): void {
    if (!this.worker) return;

    this.worker.onmessage = (event: MessageEvent<string>) => {
      const message = event.data;

      if (typeof message !== 'string') return;

      // Log all messages for debugging
      if (message.startsWith('bestmove') || message.includes('depth')) {
        console.log('[EngineService] Message:', message.substring(0, 100));
      }

      if (message.startsWith('bestmove')) {
        this.handleBestMove(message);
      } else if (message.startsWith('info') && message.includes('depth')) {
        this.handleInfo(message);
      }
    };

    this.worker.onerror = (error) => {
      console.error('[EngineService] Worker error:', error);
      this.state = 'error';
      this.emit({ type: 'error', data: new Error('Worker error') });
    };
  }

  /**
   * Handle bestmove message
   */
  private handleBestMove(message: string): void {
    // Clear timeout since we got a response
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
      this.analysisTimeout = null;
    }

    const parts = message.split(' ');
    const bestMove = parts[1];

    if (!bestMove || bestMove === '(none)') {
      console.log('[EngineService] No valid move found');
      return;
    }

    this.currentBestMove = bestMove;
    this.state = 'idle';

    console.log('[EngineService] Best move:', bestMove, 'Score:', this.currentScore);

    this.emit({
      type: 'bestmove',
      data: {
        bestMove,
        score: this.currentScore,
        depth: this.currentDepth,
        pv: [bestMove],
      },
    });
  }

  /**
   * Handle info message
   */
  private handleInfo(message: string): void {
    const scoreMatch = message.match(/score cp (-?\d+)/);
    const depthMatch = message.match(/depth (\d+)/);
    const pvMatch = message.match(/ pv ([a-h][1-8][a-h][1-8](?:[qrbn])?)/);

    if (scoreMatch && depthMatch && pvMatch) {
      const score = parseInt(scoreMatch[1], 10);
      const depth = parseInt(depthMatch[1], 10);
      const move = pvMatch[1];

      this.currentScore = score;
      this.currentDepth = depth;
      this.currentBestMove = move;

      this.emit({
        type: 'info',
        data: {
          depth,
          score,
          pv: move,
        },
      });
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: EngineEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[EngineService] Listener error:', error);
      }
    });
  }
}
