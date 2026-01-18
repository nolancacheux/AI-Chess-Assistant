/**
 * Chess Utilities - Helper functions for chess operations
 */

import type { ChessFile, MoveRating, Score, UCIMove } from '@/types';
import { FILE_TO_NUMBER, NUMBER_TO_FILE } from '@/types';

/**
 * Parse UCI move notation into from/to squares
 */
export function parseUCIMove(move: UCIMove): { from: string; to: string; promotion?: string } {
  const from = move.substring(0, 2);
  const to = move.substring(2, 4);
  const promotion = move.length > 4 ? move.substring(4) : undefined;
  return { from, to, promotion };
}

/**
 * Convert file letter to board coordinate (1-8)
 */
export function fileToCoord(file: string): number {
  return FILE_TO_NUMBER[file as ChessFile] ?? 0;
}

/**
 * Convert board coordinate (1-8) to file letter
 */
export function coordToFile(coord: number): ChessFile | null {
  return NUMBER_TO_FILE[coord] ?? null;
}

/**
 * Get move rating based on centipawn score
 */
export function getMoveRating(score: Score | null | undefined): MoveRating {
  if (score === null || score === undefined) return '-';

  // Checkmate or forced mate
  if (score > 2000) return 'Winning';
  if (score < -2000) return 'Losing';

  // Decisive advantage
  if (score > 1000) return 'Decisive Advantage';
  if (score < -1000) return 'Decisive Disadvantage';

  // Clear advantage
  if (score > 500) return 'Clear Advantage';
  if (score < -500) return 'Clear Disadvantage';

  // Significant advantage
  if (score > 300) return 'Significant Advantage';
  if (score < -300) return 'Significant Disadvantage';

  // Slight advantage
  if (score > 200) return 'Slight Advantage';
  if (score < -200) return 'Slight Disadvantage';

  return 'Equal';
}

/**
 * Convert score to percentage for advantage bar (0-100)
 */
export function scoreToPercentage(score: Score | null | undefined): number {
  if (score === null || score === undefined) return 50;

  const maxScore = 2000;
  const percentage = 50 + (score / maxScore) * 50;
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Check if a move is likely a pawn promotion
 */
export function isPromotionMove(
  move: UCIMove,
  playerColor: 'w' | 'b'
): boolean {
  const { from, to } = parseUCIMove(move);
  const fromRank = parseInt(from[1]);
  const toRank = parseInt(to[1]);

  if (playerColor === 'w') {
    return fromRank === 7 && toRank === 8;
  } else {
    return fromRank === 2 && toRank === 1;
  }
}
