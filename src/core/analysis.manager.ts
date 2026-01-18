/**
 * Analysis Manager - Manages analysis history and state
 */

import type { AnalysisEntry, Depth, Score, UCIMove } from '@/types';

const MAX_HISTORY_SIZE = 100;
const MAX_REPETITION_COUNT = 3;
const REPETITION_DEPTH_THRESHOLD = 20;

/**
 * Manages analysis history and repetition detection
 */
export class AnalysisManager {
  private history: AnalysisEntry[] = [];
  private lastBestMove: UCIMove | null = null;
  private moveRepetitionCount = 0;
  private lastOpponentMoveTimestamp: Date | null = null;

  /**
   * Add new analysis entry
   */
  public addEntry(
    move: UCIMove,
    score: Score | null,
    depth: Depth,
    isFinal: boolean
  ): boolean {
    // Validate entry
    if (!move || score === null || !depth) return false;
    if (depth < 1 || depth > 26) return false;

    // Check for duplicates
    const lastEntry = this.history[0];
    if (lastEntry?.depth === depth && lastEntry?.move === move) return false;

    // Check for repetition
    if (move === this.lastBestMove) {
      this.moveRepetitionCount++;
      if (this.moveRepetitionCount >= MAX_REPETITION_COUNT && depth >= REPETITION_DEPTH_THRESHOLD) {
        return false; // Signal to stop analysis
      }
    } else {
      this.lastBestMove = move;
      this.moveRepetitionCount = 1;
    }

    // Add entry
    this.history.unshift({
      move,
      score,
      depth,
      isFinal,
      timestamp: new Date().toISOString(),
    });

    // Limit history size
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history.pop();
    }

    return true;
  }

  /**
   * Get analysis history
   */
  public getHistory(): AnalysisEntry[] {
    return [...this.history];
  }

  /**
   * Clear analysis history
   */
  public clearHistory(): void {
    this.history = [];
    this.lastBestMove = null;
    this.moveRepetitionCount = 0;
  }

  /**
   * Get latest best move
   */
  public getLatestBestMove(): UCIMove | null {
    const finalEntry = this.history.find((entry) => entry.isFinal);
    return finalEntry?.move ?? this.history[0]?.move ?? null;
  }

  /**
   * Get latest score
   */
  public getLatestScore(): Score | null {
    return this.history[0]?.score ?? null;
  }

  /**
   * Record opponent move timestamp
   */
  public recordOpponentMove(): void {
    this.lastOpponentMoveTimestamp = new Date();
  }

  /**
   * Get opponent move timestamp
   */
  public getOpponentMoveTimestamp(): Date | null {
    return this.lastOpponentMoveTimestamp;
  }

  /**
   * Get valid moves for auto-play (after opponent's move)
   */
  public getValidMovesForAutoPlay(targetDepth: Depth): AnalysisEntry[] {
    if (!this.lastOpponentMoveTimestamp) return [];

    return this.history.filter((entry) => {
      const moveTime = new Date(entry.timestamp);
      return moveTime > this.lastOpponentMoveTimestamp! && entry.depth === targetDepth;
    });
  }

  /**
   * Get any valid move for auto-play (fallback)
   */
  public getAnyValidMoveForAutoPlay(): AnalysisEntry | null {
    if (!this.lastOpponentMoveTimestamp) return this.history[0] ?? null;

    const validMoves = this.history.filter((entry) => {
      const moveTime = new Date(entry.timestamp);
      return moveTime > this.lastOpponentMoveTimestamp!;
    });

    if (validMoves.length === 0) return this.history[0] ?? null;

    // Sort by final status, then by depth
    validMoves.sort((a, b) => {
      if (a.isFinal && !b.isFinal) return -1;
      if (!a.isFinal && b.isFinal) return 1;
      return b.depth - a.depth;
    });

    return validMoves[0];
  }

  /**
   * Check if should stop analysis due to repetition
   */
  public shouldStopAnalysis(): boolean {
    return (
      this.moveRepetitionCount >= MAX_REPETITION_COUNT &&
      (this.history[0]?.depth ?? 0) >= REPETITION_DEPTH_THRESHOLD
    );
  }
}
