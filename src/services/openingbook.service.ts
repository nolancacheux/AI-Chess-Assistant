/**
 * Opening Book Service
 * Provides opening book lookups and suggestions
 */

import type { UCIMove } from '@/types';
import {
  type Opening,
  type OpeningMove,
  NAMED_OPENINGS,
  getBestBookMove,
  getOpeningMoves,
  getOpeningName,
  isInOpeningBook,
} from '@/data/openings.data';

export interface OpeningInfo {
  name: string | null;
  eco: string | null;
  description: string | null;
  isInBook: boolean;
  bookMoves: OpeningMove[];
  suggestedMove: UCIMove | null;
}

/**
 * Opening Book Service
 */
export class OpeningBookService {
  private moveHistory: UCIMove[] = [];

  /**
   * Reset move history (for new game)
   */
  public reset(): void {
    this.moveHistory = [];
  }

  /**
   * Add a move to history
   */
  public addMove(move: UCIMove): void {
    this.moveHistory.push(move);
  }

  /**
   * Get opening information for current position
   */
  public getOpeningInfo(fen: string): OpeningInfo {
    const isInBook = isInOpeningBook(fen);
    const bookMoves = getOpeningMoves(fen);
    const name = getOpeningName(fen);
    const bestMove = getBestBookMove(fen);

    // Try to find matching named opening
    const namedOpening = this.findNamedOpening();

    return {
      name: namedOpening?.name ?? name,
      eco: namedOpening?.eco ?? null,
      description: namedOpening?.description ?? null,
      isInBook,
      bookMoves,
      suggestedMove: bestMove?.move ?? null,
    };
  }

  /**
   * Check if we should use book move instead of engine
   */
  public shouldUseBookMove(fen: string): boolean {
    return isInOpeningBook(fen) && this.moveHistory.length < 20;
  }

  /**
   * Get book move if available
   */
  public getBookMove(fen: string): UCIMove | null {
    const bestMove = getBestBookMove(fen);
    return bestMove?.move ?? null;
  }

  /**
   * Get all book moves with stats
   */
  public getBookMoves(fen: string): OpeningMove[] {
    return getOpeningMoves(fen);
  }

  /**
   * Find named opening based on move history
   */
  private findNamedOpening(): Opening | null {
    if (this.moveHistory.length === 0) return null;

    // Find opening that matches our move history
    for (const opening of NAMED_OPENINGS) {
      if (this.movesMatch(opening.moves)) {
        return opening;
      }
    }

    // Find partial match
    for (const opening of NAMED_OPENINGS) {
      if (this.movesMatchPartial(opening.moves)) {
        return opening;
      }
    }

    return null;
  }

  /**
   * Check if moves match exactly
   */
  private movesMatch(openingMoves: string[]): boolean {
    if (this.moveHistory.length !== openingMoves.length) return false;
    return openingMoves.every((move, i) => this.moveHistory[i] === move);
  }

  /**
   * Check if our history is a prefix of opening moves
   */
  private movesMatchPartial(openingMoves: string[]): boolean {
    if (this.moveHistory.length > openingMoves.length) return false;
    return this.moveHistory.every((move, i) => openingMoves[i] === move);
  }

  /**
   * Get statistics for a move
   */
  public getMoveStats(fen: string, move: UCIMove): OpeningMove | null {
    const moves = getOpeningMoves(fen);
    return moves.find((m) => m.move === move) ?? null;
  }
}

/** Singleton instance */
export const openingBookService = new OpeningBookService();
