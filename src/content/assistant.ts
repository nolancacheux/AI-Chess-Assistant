/**
 * Chess Assistant - Main controller class
 */

import { PanelComponent, clearHighlights, displayMoveHighlight } from '@/components';
import { AnalysisManager, AutoPlayManager } from '@/core';
import { EngineService, boardService } from '@/services';
import { DEFAULT_ENGINE_CONFIG } from '@/types';
import type { AnalysisEntry, EngineEvent, PlayerColor } from '@/types';

const POLLING_INTERVAL = 500;

/**
 * Chess Assistant - Orchestrates all components
 */
export class ChessAssistant {
  private panel: PanelComponent;
  private engine: EngineService;
  private analysisManager: AnalysisManager;
  private autoPlayManager: AutoPlayManager;

  private isActive = false;
  private playerColor: PlayerColor = 'w';
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private waitingForOpponentMove = false;

  constructor() {
    this.engine = new EngineService();
    this.analysisManager = new AnalysisManager();
    this.autoPlayManager = new AutoPlayManager();
    this.panel = new PanelComponent({
      onActivate: () => this.promptForColor(),
      onDeactivate: () => this.deactivate(),
      onColorSelect: (color) => this.activate(color),
      onAutoPlayToggle: (active) => this.handleAutoPlayToggle(active),
    });
  }

  /**
   * Initialize the assistant
   */
  public initialize(): void {
    this.panel.create();
  }

  /**
   * Prompt user to select color
   */
  private promptForColor(): void {
    if (!boardService.findBoard()) {
      alert('Could not find the chessboard. Make sure you are on a game page.');
      return;
    }

    this.panel.showColorSelection();
  }

  /**
   * Activate the assistant with selected color
   */
  private activate(color: PlayerColor): void {
    this.playerColor = color;
    this.autoPlayManager.setPlayerColor(color);

    if (!this.engine.initialize()) {
      alert('Could not load Stockfish engine');
      this.panel.showInactiveState();
      return;
    }

    this.setupEngineListener();
    this.startBoardPolling();
    boardService.addBoardBorder();

    this.isActive = true;
    this.panel.showActiveState();
    this.panel.updateStatus(`Analyzing for ${color === 'w' ? 'White' : 'Black'}...`);

    // Initial analysis
    const fen = boardService.generateFullFEN(color);
    this.engine.analyze(fen);
  }

  /**
   * Deactivate the assistant
   */
  private deactivate(): void {
    this.stopBoardPolling();
    this.engine.terminate();

    const board = boardService.getBoard();
    if (board) {
      clearHighlights(board);
    }

    this.isActive = false;
    this.autoPlayManager.setActive(false);
    this.analysisManager.clearHistory();
    this.panel.showInactiveState();
  }

  /**
   * Setup engine event listener
   */
  private setupEngineListener(): void {
    this.engine.subscribe((event: EngineEvent) => {
      if (event.type === 'bestmove' || event.type === 'info') {
        this.handleEngineUpdate(event);
      }
    });
  }

  /**
   * Handle engine analysis update
   */
  private handleEngineUpdate(event: EngineEvent): void {
    const move = this.engine.getBestMove();
    const score = this.engine.getScore();
    const depth = this.engine.getDepth();

    if (!move) return;

    const isFinal = event.type === 'bestmove';
    this.analysisManager.addEntry(move, score, depth, isFinal);

    // Update UI
    this.panel.updateStatus(
      isFinal
        ? `Suggested Move: ${move}`
        : `Depth: ${depth} | Score: ${score} | Move: ${move}`
    );
    this.panel.updateHistory(this.analysisManager.getHistory());
    this.panel.updateAdvantage(score);

    // Update board highlights
    const board = boardService.getBoard();
    if (board && !this.waitingForOpponentMove) {
      displayMoveHighlight(move, board);
    }

    // Check for auto-play
    if (this.autoPlayManager.isAutoPlayActive() && isFinal && !this.waitingForOpponentMove) {
      this.executeAutoPlay();
    }
  }

  /**
   * Start board polling for changes
   */
  private startBoardPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    boardService.updateLastBoardState();
    this.waitingForOpponentMove = false;

    this.pollingInterval = setInterval(() => {
      if (!this.isActive) return;

      if (boardService.hasBoardChanged()) {
        this.handleBoardChange();
      }
    }, POLLING_INTERVAL);
  }

  /**
   * Stop board polling
   */
  private stopBoardPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Handle board state change
   */
  private handleBoardChange(): void {
    const fen = boardService.generateFullFEN(this.playerColor);

    // Simple turn detection based on move count parity
    // In a more sophisticated implementation, we'd track actual turns
    if (this.waitingForOpponentMove) {
      // Opponent has moved
      this.waitingForOpponentMove = false;
      this.analysisManager.recordOpponentMove();
      this.analysisManager.clearHistory();

      this.panel.updateStatus('Your turn - analyzing...');
      this.engine.analyze(fen);

      // Trigger auto-play if active
      if (this.autoPlayManager.isAutoPlayActive()) {
        setTimeout(() => {
          if (this.autoPlayManager.isAutoPlayActive()) {
            this.engine.analyzeQuick(fen);
            setTimeout(() => this.executeAutoPlay(), 500);
          }
        }, 100);
      }
    } else {
      // We made a move
      this.waitingForOpponentMove = true;
      boardService.updateLastBoardState();

      const board = boardService.getBoard();
      if (board) {
        clearHighlights(board);
      }

      this.panel.updateStatus("Opponent's turn - waiting...");
    }
  }

  /**
   * Handle auto-play toggle
   */
  private handleAutoPlayToggle(active: boolean): void {
    this.autoPlayManager.setActive(active);

    if (active && !this.waitingForOpponentMove) {
      this.executeAutoPlay();
    }
  }

  /**
   * Execute auto-play move
   */
  private executeAutoPlay(): void {
    if (!this.autoPlayManager.isAutoPlayActive()) return;

    // Check if game is over
    if (this.autoPlayManager.isGameOver()) {
      this.panel.updateStatus('Game over - Auto-play disabled');
      this.autoPlayManager.setActive(false);
      return;
    }

    // Get best move
    let moveEntry: AnalysisEntry | null = null;

    // Try to get move at target depth
    const validMoves = this.analysisManager.getValidMovesForAutoPlay(
      DEFAULT_ENGINE_CONFIG.autoPlayDepth
    );

    if (validMoves.length > 0) {
      moveEntry = validMoves[0];
    } else {
      moveEntry = this.analysisManager.getAnyValidMoveForAutoPlay();
    }

    // Execute move
    if (moveEntry?.move) {
      const success = this.autoPlayManager.executeMove(moveEntry.move);
      if (success) {
        setTimeout(() => {
          this.waitingForOpponentMove = true;
          boardService.updateLastBoardState();
          this.panel.updateStatus("Opponent's turn - waiting... (Auto-play active)");
        }, 800);
      }
    }
  }
}
