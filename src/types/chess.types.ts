/**
 * Chess Types - Core type definitions for the chess assistant
 */

/** Player color representation */
export type PlayerColor = 'w' | 'b';

/** Chess piece types */
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

/** Chess files (columns) */
export type ChessFile = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

/** Chess ranks (rows) */
export type ChessRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Square notation (e.g., "e4", "d7") */
export type Square = `${ChessFile}${ChessRank}`;

/** Move in UCI format (e.g., "e2e4", "e7e8q" for promotion) */
export type UCIMove = string;

/** FEN string representing board position */
export type FENString = string;

/** Position evaluation score in centipawns */
export type Score = number;

/** Analysis depth (ply) */
export type Depth = number;

/** Analysis entry from engine */
export interface AnalysisEntry {
  move: UCIMove;
  score: Score;
  depth: Depth;
  isFinal: boolean;
  timestamp: string;
}

/** Move rating category */
export type MoveRating =
  | 'Winning'
  | 'Losing'
  | 'Decisive Advantage'
  | 'Decisive Disadvantage'
  | 'Clear Advantage'
  | 'Clear Disadvantage'
  | 'Significant Advantage'
  | 'Significant Disadvantage'
  | 'Slight Advantage'
  | 'Slight Disadvantage'
  | 'Equal'
  | '-';

/** Coordinate mapping for file to number */
export const FILE_TO_NUMBER: Record<ChessFile, number> = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
  f: 6,
  g: 7,
  h: 8,
};

/** Coordinate mapping for number to file */
export const NUMBER_TO_FILE: Record<number, ChessFile> = {
  1: 'a',
  2: 'b',
  3: 'c',
  4: 'd',
  5: 'e',
  6: 'f',
  7: 'g',
  8: 'h',
};
