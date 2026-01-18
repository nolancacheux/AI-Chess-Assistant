/**
 * Chess Pattern Recognition Data
 * Defines tactical and positional patterns for analysis
 */

/** Pattern category */
export type PatternCategory = 'tactical' | 'positional' | 'structural';

/** Pattern severity/importance */
export type PatternSeverity = 'critical' | 'important' | 'minor';

/** Detected pattern */
export interface ChessPattern {
  id: string;
  name: string;
  category: PatternCategory;
  severity: PatternSeverity;
  description: string;
  squares?: string[]; // Involved squares
  evaluation?: number; // Impact on evaluation
}

/** Piece positions for pattern detection */
export interface PiecePosition {
  piece: string; // 'P', 'N', 'B', 'R', 'Q', 'K' (uppercase = white)
  square: string; // e.g., 'e4'
  file: number; // 1-8
  rank: number; // 1-8
}

/**
 * Pattern definitions with detection rules
 */
export const PATTERN_DEFINITIONS = {
  // Pawn Structure Patterns
  DOUBLED_PAWNS: {
    name: 'Doubled Pawns',
    category: 'structural' as PatternCategory,
    severity: 'minor' as PatternSeverity,
    description: 'Two pawns on the same file, reducing mobility',
    evaluation: -0.25,
  },
  ISOLATED_PAWN: {
    name: 'Isolated Pawn',
    category: 'structural' as PatternCategory,
    severity: 'minor' as PatternSeverity,
    description: 'A pawn with no friendly pawns on adjacent files',
    evaluation: -0.3,
  },
  PASSED_PAWN: {
    name: 'Passed Pawn',
    category: 'structural' as PatternCategory,
    severity: 'important' as PatternSeverity,
    description: 'A pawn with no enemy pawns blocking its path to promotion',
    evaluation: 0.5,
  },
  BACKWARD_PAWN: {
    name: 'Backward Pawn',
    category: 'structural' as PatternCategory,
    severity: 'minor' as PatternSeverity,
    description: 'A pawn that cannot advance without being captured',
    evaluation: -0.2,
  },
  PAWN_CHAIN: {
    name: 'Pawn Chain',
    category: 'structural' as PatternCategory,
    severity: 'minor' as PatternSeverity,
    description: 'Diagonal chain of pawns protecting each other',
    evaluation: 0.15,
  },

  // King Safety Patterns
  CASTLED_KING: {
    name: 'Castled King',
    category: 'positional' as PatternCategory,
    severity: 'important' as PatternSeverity,
    description: 'King has castled to safety',
    evaluation: 0.3,
  },
  EXPOSED_KING: {
    name: 'Exposed King',
    category: 'positional' as PatternCategory,
    severity: 'critical' as PatternSeverity,
    description: 'King in the center without pawn shelter',
    evaluation: -0.8,
  },
  BACK_RANK_WEAKNESS: {
    name: 'Back Rank Weakness',
    category: 'tactical' as PatternCategory,
    severity: 'critical' as PatternSeverity,
    description: 'King trapped on back rank with no escape squares',
    evaluation: -1.0,
  },

  // Tactical Patterns
  HANGING_PIECE: {
    name: 'Hanging Piece',
    category: 'tactical' as PatternCategory,
    severity: 'critical' as PatternSeverity,
    description: 'Undefended piece that can be captured',
    evaluation: -2.0,
  },
  FORK_THREAT: {
    name: 'Fork Potential',
    category: 'tactical' as PatternCategory,
    severity: 'important' as PatternSeverity,
    description: 'Piece can attack multiple targets simultaneously',
    evaluation: 0.5,
  },
  PIN: {
    name: 'Pin',
    category: 'tactical' as PatternCategory,
    severity: 'important' as PatternSeverity,
    description: 'Piece cannot move without exposing more valuable piece',
    evaluation: 0.4,
  },
  SKEWER: {
    name: 'Skewer',
    category: 'tactical' as PatternCategory,
    severity: 'important' as PatternSeverity,
    description: 'Attack on valuable piece forcing it to move, exposing piece behind',
    evaluation: 0.5,
  },

  // Piece Activity Patterns
  FIANCHETTO: {
    name: 'Fianchetto',
    category: 'positional' as PatternCategory,
    severity: 'minor' as PatternSeverity,
    description: 'Bishop developed to long diagonal (b2/g2 or b7/g7)',
    evaluation: 0.1,
  },
  ROOK_ON_OPEN_FILE: {
    name: 'Rook on Open File',
    category: 'positional' as PatternCategory,
    severity: 'important' as PatternSeverity,
    description: 'Rook on a file with no pawns',
    evaluation: 0.3,
  },
  ROOK_ON_7TH: {
    name: 'Rook on 7th Rank',
    category: 'positional' as PatternCategory,
    severity: 'important' as PatternSeverity,
    description: 'Rook penetrated to 7th rank, attacking pawns',
    evaluation: 0.5,
  },
  BISHOP_PAIR: {
    name: 'Bishop Pair',
    category: 'positional' as PatternCategory,
    severity: 'important' as PatternSeverity,
    description: 'Both bishops present, strong in open positions',
    evaluation: 0.4,
  },
  KNIGHT_OUTPOST: {
    name: 'Knight Outpost',
    category: 'positional' as PatternCategory,
    severity: 'important' as PatternSeverity,
    description: 'Knight on strong square that cannot be attacked by pawns',
    evaluation: 0.35,
  },

  // Center Control
  STRONG_CENTER: {
    name: 'Strong Center',
    category: 'positional' as PatternCategory,
    severity: 'important' as PatternSeverity,
    description: 'Good control of central squares (d4, d5, e4, e5)',
    evaluation: 0.3,
  },
};

/**
 * Piece values for tactical calculations
 */
export const PIECE_VALUES: Record<string, number> = {
  P: 1,
  N: 3,
  B: 3.25,
  R: 5,
  Q: 9,
  K: 0, // King has no material value
  p: 1,
  n: 3,
  b: 3.25,
  r: 5,
  q: 9,
  k: 0,
};

/**
 * Check if a square is controlled by a piece
 */
export function getAttackedSquares(piece: string, file: number, rank: number): string[] {
  const squares: string[] = [];
  const pieceType = piece.toLowerCase();
  const files = 'abcdefgh';

  switch (pieceType) {
    case 'p': {
      // Pawn attacks diagonally
      const direction = piece === 'P' ? 1 : -1;
      if (file > 1) squares.push(`${files[file - 2]}${rank + direction}`);
      if (file < 8) squares.push(`${files[file]}${rank + direction}`);
      break;
    }
    case 'n': {
      // Knight moves in L-shape
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [df, dr] of knightMoves) {
        const newFile = file + df;
        const newRank = rank + dr;
        if (newFile >= 1 && newFile <= 8 && newRank >= 1 && newRank <= 8) {
          squares.push(`${files[newFile - 1]}${newRank}`);
        }
      }
      break;
    }
    case 'b': {
      // Bishop moves diagonally
      for (const [df, dr] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        for (let i = 1; i <= 7; i++) {
          const newFile = file + df * i;
          const newRank = rank + dr * i;
          if (newFile >= 1 && newFile <= 8 && newRank >= 1 && newRank <= 8) {
            squares.push(`${files[newFile - 1]}${newRank}`);
          } else break;
        }
      }
      break;
    }
    case 'r': {
      // Rook moves horizontally and vertically
      for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        for (let i = 1; i <= 7; i++) {
          const newFile = file + df * i;
          const newRank = rank + dr * i;
          if (newFile >= 1 && newFile <= 8 && newRank >= 1 && newRank <= 8) {
            squares.push(`${files[newFile - 1]}${newRank}`);
          } else break;
        }
      }
      break;
    }
    case 'q': {
      // Queen combines rook and bishop
      squares.push(...getAttackedSquares('r', file, rank));
      squares.push(...getAttackedSquares('b', file, rank));
      break;
    }
    case 'k': {
      // King moves one square in any direction
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const newFile = file + df;
          const newRank = rank + dr;
          if (newFile >= 1 && newFile <= 8 && newRank >= 1 && newRank <= 8) {
            squares.push(`${files[newFile - 1]}${newRank}`);
          }
        }
      }
      break;
    }
  }

  return squares;
}
