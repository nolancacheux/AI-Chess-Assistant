/**
 * Opening Book Database
 * Contains common chess openings with ECO codes, names, and move sequences
 */

export interface Opening {
  eco: string; // ECO code (e.g., "B20")
  name: string; // Opening name
  moves: string[]; // Moves in UCI format
  fen?: string; // Final FEN position (optional)
  description?: string; // Brief description
}

export interface OpeningMove {
  move: string; // UCI move
  frequency: number; // How often this move is played (0-1)
  winRate: number; // Win rate for this move (0-1)
  openingName?: string; // Name of the opening this leads to
}

/**
 * Opening Book - Common chess openings organized by starting position
 * Key is the FEN position (pieces only, no turn/castling info)
 */
export const OPENING_BOOK: Record<string, OpeningMove[]> = {
  // Starting position
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR': [
    { move: 'e2e4', frequency: 0.35, winRate: 0.54, openingName: "King's Pawn Opening" },
    { move: 'd2d4', frequency: 0.35, winRate: 0.55, openingName: "Queen's Pawn Opening" },
    { move: 'g1f3', frequency: 0.15, winRate: 0.53, openingName: 'Reti Opening' },
    { move: 'c2c4', frequency: 0.10, winRate: 0.52, openingName: 'English Opening' },
  ],

  // After 1.e4
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR': [
    { move: 'e7e5', frequency: 0.30, winRate: 0.45, openingName: 'Open Game' },
    { move: 'c7c5', frequency: 0.25, winRate: 0.46, openingName: 'Sicilian Defense' },
    { move: 'e7e6', frequency: 0.15, winRate: 0.44, openingName: 'French Defense' },
    { move: 'c7c6', frequency: 0.12, winRate: 0.45, openingName: 'Caro-Kann Defense' },
    { move: 'd7d5', frequency: 0.08, winRate: 0.43, openingName: 'Scandinavian Defense' },
  ],

  // After 1.e4 e5
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR': [
    { move: 'g1f3', frequency: 0.70, winRate: 0.55, openingName: "King's Knight Opening" },
    { move: 'f1c4', frequency: 0.15, winRate: 0.54, openingName: 'Italian Game' },
    { move: 'b1c3', frequency: 0.08, winRate: 0.53, openingName: 'Vienna Game' },
    { move: 'f2f4', frequency: 0.05, winRate: 0.52, openingName: "King's Gambit" },
  ],

  // After 1.e4 e5 2.Nf3
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R': [
    { move: 'b8c6', frequency: 0.80, winRate: 0.46, openingName: "King's Knight Defense" },
    { move: 'g8f6', frequency: 0.12, winRate: 0.44, openingName: 'Petrov Defense' },
    { move: 'd7d6', frequency: 0.05, winRate: 0.43, openingName: 'Philidor Defense' },
  ],

  // After 1.e4 e5 2.Nf3 Nc6
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R': [
    { move: 'f1b5', frequency: 0.50, winRate: 0.55, openingName: 'Ruy Lopez' },
    { move: 'f1c4', frequency: 0.30, winRate: 0.54, openingName: 'Italian Game' },
    { move: 'd2d4', frequency: 0.12, winRate: 0.53, openingName: 'Scotch Game' },
    { move: 'b1c3', frequency: 0.05, winRate: 0.52, openingName: 'Four Knights Game' },
  ],

  // After 1.e4 c5 (Sicilian)
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR': [
    { move: 'g1f3', frequency: 0.60, winRate: 0.55, openingName: 'Open Sicilian' },
    { move: 'b1c3', frequency: 0.15, winRate: 0.53, openingName: 'Closed Sicilian' },
    { move: 'c2c3', frequency: 0.12, winRate: 0.52, openingName: 'Alapin Sicilian' },
    { move: 'd2d4', frequency: 0.08, winRate: 0.51, openingName: 'Smith-Morra Gambit' },
  ],

  // After 1.e4 c5 2.Nf3
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R': [
    { move: 'd7d6', frequency: 0.40, winRate: 0.46, openingName: 'Sicilian Najdorf/Dragon' },
    { move: 'b8c6', frequency: 0.30, winRate: 0.45, openingName: 'Sicilian Classical' },
    { move: 'e7e6', frequency: 0.25, winRate: 0.46, openingName: 'Sicilian Scheveningen' },
  ],

  // After 1.d4
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR': [
    { move: 'd7d5', frequency: 0.40, winRate: 0.45, openingName: 'Closed Game' },
    { move: 'g8f6', frequency: 0.35, winRate: 0.46, openingName: 'Indian Defense' },
    { move: 'f7f5', frequency: 0.05, winRate: 0.42, openingName: 'Dutch Defense' },
  ],

  // After 1.d4 d5
  'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR': [
    { move: 'c2c4', frequency: 0.70, winRate: 0.55, openingName: "Queen's Gambit" },
    { move: 'g1f3', frequency: 0.15, winRate: 0.53, openingName: 'London System' },
    { move: 'c1f4', frequency: 0.10, winRate: 0.52, openingName: 'London System' },
  ],

  // After 1.d4 d5 2.c4 (Queen's Gambit)
  'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR': [
    { move: 'e7e6', frequency: 0.45, winRate: 0.46, openingName: "Queen's Gambit Declined" },
    { move: 'd5c4', frequency: 0.30, winRate: 0.44, openingName: "Queen's Gambit Accepted" },
    { move: 'c7c6', frequency: 0.20, winRate: 0.45, openingName: 'Slav Defense' },
  ],

  // After 1.d4 Nf6
  'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR': [
    { move: 'c2c4', frequency: 0.60, winRate: 0.54, openingName: 'Indian Game' },
    { move: 'g1f3', frequency: 0.20, winRate: 0.53, openingName: 'Indian Game' },
    { move: 'c1f4', frequency: 0.12, winRate: 0.52, openingName: 'London System' },
  ],

  // After 1.d4 Nf6 2.c4
  'rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR': [
    { move: 'e7e6', frequency: 0.35, winRate: 0.46, openingName: 'Nimzo-Indian/QID' },
    { move: 'g7g6', frequency: 0.30, winRate: 0.45, openingName: "King's Indian Defense" },
    { move: 'c7c5', frequency: 0.15, winRate: 0.44, openingName: 'Benoni Defense' },
    { move: 'e7e5', frequency: 0.10, winRate: 0.43, openingName: 'Budapest Gambit' },
  ],

  // After 1.Nf3 (Reti)
  'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R': [
    { move: 'd7d5', frequency: 0.40, winRate: 0.46, openingName: 'Reti Opening' },
    { move: 'g8f6', frequency: 0.30, winRate: 0.47, openingName: 'Reti Opening' },
    { move: 'c7c5', frequency: 0.15, winRate: 0.45, openingName: 'Symmetrical English' },
  ],

  // After 1.c4 (English)
  'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR': [
    { move: 'e7e5', frequency: 0.35, winRate: 0.46, openingName: 'Reversed Sicilian' },
    { move: 'g8f6', frequency: 0.30, winRate: 0.47, openingName: 'English Opening' },
    { move: 'c7c5', frequency: 0.20, winRate: 0.48, openingName: 'Symmetrical English' },
  ],
};

/**
 * Named openings with full move sequences
 */
export const NAMED_OPENINGS: Opening[] = [
  // Open Games (1.e4 e5)
  {
    eco: 'C50',
    name: 'Italian Game',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'],
    description: 'Classical opening aiming for central control and kingside attack',
  },
  {
    eco: 'C60',
    name: 'Ruy Lopez',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
    description: 'One of the oldest and most respected openings',
  },
  {
    eco: 'C45',
    name: 'Scotch Game',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4'],
    description: 'Direct approach to challenge the center early',
  },
  {
    eco: 'C30',
    name: "King's Gambit",
    moves: ['e2e4', 'e7e5', 'f2f4'],
    description: 'Aggressive gambit sacrificing a pawn for rapid development',
  },

  // Sicilian Defense (1.e4 c5)
  {
    eco: 'B90',
    name: 'Sicilian Najdorf',
    moves: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'a7a6'],
    description: "Most popular Sicilian, favored by Fischer and Kasparov",
  },
  {
    eco: 'B70',
    name: 'Sicilian Dragon',
    moves: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'g7g6'],
    description: 'Sharp counterattacking system with kingside fianchetto',
  },

  // French Defense (1.e4 e6)
  {
    eco: 'C00',
    name: 'French Defense',
    moves: ['e2e4', 'e7e6'],
    description: 'Solid defense leading to closed positions',
  },

  // Caro-Kann (1.e4 c6)
  {
    eco: 'B10',
    name: 'Caro-Kann Defense',
    moves: ['e2e4', 'c7c6'],
    description: 'Solid and reliable defense with good pawn structure',
  },

  // Queen's Gambit
  {
    eco: 'D30',
    name: "Queen's Gambit Declined",
    moves: ['d2d4', 'd7d5', 'c2c4', 'e7e6'],
    description: 'Classical defense maintaining solid pawn structure',
  },
  {
    eco: 'D20',
    name: "Queen's Gambit Accepted",
    moves: ['d2d4', 'd7d5', 'c2c4', 'd5c4'],
    description: 'Accepting the gambit pawn for active counterplay',
  },
  {
    eco: 'D10',
    name: 'Slav Defense',
    moves: ['d2d4', 'd7d5', 'c2c4', 'c7c6'],
    description: 'Solid defense supporting d5 with c6',
  },

  // Indian Defenses
  {
    eco: 'E60',
    name: "King's Indian Defense",
    moves: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7'],
    description: 'Hypermodern defense allowing White center then counterattacking',
  },
  {
    eco: 'E20',
    name: 'Nimzo-Indian Defense',
    moves: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'b1c3', 'f8b4'],
    description: 'Strategic defense pinning the knight on c3',
  },
  {
    eco: 'A45',
    name: 'London System',
    moves: ['d2d4', 'd7d5', 'c1f4'],
    description: 'Solid system with easy-to-learn setup',
  },
];

/**
 * Get opening moves for a given FEN position
 */
export function getOpeningMoves(fen: string): OpeningMove[] {
  // Extract just the piece positions from FEN (first part)
  const positionPart = fen.split(' ')[0];
  return OPENING_BOOK[positionPart] || [];
}

/**
 * Get opening name for a position
 */
export function getOpeningName(fen: string): string | null {
  const moves = getOpeningMoves(fen);
  if (moves.length > 0 && moves[0].openingName) {
    return moves[0].openingName;
  }
  return null;
}

/**
 * Check if position is in opening book
 */
export function isInOpeningBook(fen: string): boolean {
  const positionPart = fen.split(' ')[0];
  return positionPart in OPENING_BOOK;
}

/**
 * Get the best book move for a position
 */
export function getBestBookMove(fen: string): OpeningMove | null {
  const moves = getOpeningMoves(fen);
  if (moves.length === 0) return null;

  // Sort by win rate, then by frequency
  const sorted = [...moves].sort((a, b) => {
    const scoreA = a.winRate * 0.7 + a.frequency * 0.3;
    const scoreB = b.winRate * 0.7 + b.frequency * 0.3;
    return scoreB - scoreA;
  });

  return sorted[0];
}
