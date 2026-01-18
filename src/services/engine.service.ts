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
   * Tries multiple sources: chess.com's bundled engine first, then our bundled version
   */
  public initialize(): boolean {
    // Try chess.com's Stockfish first (available when on chess.com)
    if (this.tryChessComEngine()) {
      return true;
    }

    // Try our bundled Stockfish
    if (this.tryBundledEngine()) {
      return true;
    }

    console.error('[EngineService] Failed to initialize any engine');
    this.state = 'error';
    this.emit({ type: 'error', data: new Error('No engine available') });
    return false;
  }

  /**
   * Try to use publicly available Stockfish engines
   */
  private tryChessComEngine(): boolean {
    // Reliable public Stockfish WASM sources
    const enginePaths = [
      // Lichess Stockfish (most reliable)
      'https://lichess1.org/assets/_ysdPwS/javascripts/vendor/stockfish/stockfish.wasm.js',
      'https://lichess.org/assets/javascripts/vendor/stockfish.wasm/stockfish.js',
      // CDN hosted Stockfish
      'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js',
      'https://unpkg.com/stockfish.js@10.0.2/stockfish.js',
      // Chess.com paths (may change)
      'https://www.chess.com/bundles/app/js/vendor/stockfish.wasm/stockfish.js',
    ];

    for (const path of enginePaths) {
      try {
        console.log('[EngineService] Trying engine:', path);
        this.worker = new Worker(path);
        this.setupMessageHandler();
        this.worker.postMessage('uci');
        this.state = 'idle';
        this.emit({ type: 'ready', data: null });
        console.log('[EngineService] Successfully loaded engine from:', path);
        return true;
      } catch (error) {
        console.log('[EngineService] Failed to load:', path, error);
        this.worker = null;
      }
    }
    return false;
  }

  /**
   * Try to use our bundled Stockfish engine via blob URL workaround
   */
  private tryBundledEngine(): boolean {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) {
        return false;
      }

      const workerUrl = chrome.runtime.getURL(this.config.workerPath);
      console.log('[EngineService] Trying bundled engine via fetch:', workerUrl);

      // For MV3, we need to fetch the script and create a blob worker
      // This is async, so we'll try a direct approach first
      try {
        this.worker = new Worker(workerUrl, { type: 'classic' });
        this.setupMessageHandler();
        this.worker.postMessage('uci');
        this.state = 'idle';
        this.emit({ type: 'ready', data: null });
        console.log('[EngineService] Successfully loaded bundled engine');
        return true;
      } catch {
        console.log('[EngineService] Direct worker creation failed, trying blob approach');
        return false;
      }
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
