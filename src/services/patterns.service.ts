/**
 * Pattern Recognition Service
 * Analyzes chess positions for tactical and positional patterns
 */

import type { FENString } from '@/types';
import {
  type ChessPattern,
  type PiecePosition,
  PATTERN_DEFINITIONS,
  PIECE_VALUES,
} from '@/data/patterns.data';

export interface PatternAnalysis {
  patterns: ChessPattern[];
  evaluation: number; // Combined evaluation impact
  summary: string;
}

/**
 * Pattern Recognition Service
 */
export class PatternService {
  /**
   * Analyze a position for patterns
   */
  public analyzePosition(fen: FENString): PatternAnalysis {
    const pieces = this.parseFEN(fen);
    const patterns: ChessPattern[] = [];

    // Analyze pawn structure
    patterns.push(...this.analyzePawnStructure(pieces));

    // Analyze king safety
    patterns.push(...this.analyzeKingSafety(pieces));

    // Analyze piece activity
    patterns.push(...this.analyzePieceActivity(pieces));

    // Analyze tactical patterns
    patterns.push(...this.analyzeTacticalPatterns(pieces));

    // Calculate combined evaluation
    const evaluation = patterns.reduce((sum, p) => sum + (p.evaluation || 0), 0);

    // Generate summary
    const summary = this.generateSummary(patterns);

    return { patterns, evaluation, summary };
  }

  /**
   * Parse FEN string into piece positions
   */
  private parseFEN(fen: string): PiecePosition[] {
    const pieces: PiecePosition[] = [];
    const position = fen.split(' ')[0];
    const ranks = position.split('/');
    const files = 'abcdefgh';

    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      const rank = ranks[rankIndex];
      let fileIndex = 0;

      for (const char of rank) {
        if (/[1-8]/.test(char)) {
          fileIndex += parseInt(char);
        } else {
          pieces.push({
            piece: char,
            square: `${files[fileIndex]}${8 - rankIndex}`,
            file: fileIndex + 1,
            rank: 8 - rankIndex,
          });
          fileIndex++;
        }
      }
    }

    return pieces;
  }

  /**
   * Analyze pawn structure patterns
   */
  private analyzePawnStructure(pieces: PiecePosition[]): ChessPattern[] {
    const patterns: ChessPattern[] = [];
    const whitePawns = pieces.filter((p) => p.piece === 'P');
    const blackPawns = pieces.filter((p) => p.piece === 'p');

    // Check for doubled pawns
    for (let file = 1; file <= 8; file++) {
      const whiteOnFile = whitePawns.filter((p) => p.file === file);
      const blackOnFile = blackPawns.filter((p) => p.file === file);

      if (whiteOnFile.length > 1) {
        patterns.push({
          ...PATTERN_DEFINITIONS.DOUBLED_PAWNS,
          id: `doubled-white-${file}`,
          squares: whiteOnFile.map((p) => p.square),
        });
      }
      if (blackOnFile.length > 1) {
        patterns.push({
          ...PATTERN_DEFINITIONS.DOUBLED_PAWNS,
          id: `doubled-black-${file}`,
          squares: blackOnFile.map((p) => p.square),
        });
      }
    }

    // Check for isolated pawns
    for (const pawn of whitePawns) {
      const hasNeighbor = whitePawns.some(
        (p) => Math.abs(p.file - pawn.file) === 1
      );
      if (!hasNeighbor) {
        patterns.push({
          ...PATTERN_DEFINITIONS.ISOLATED_PAWN,
          id: `isolated-white-${pawn.square}`,
          squares: [pawn.square],
        });
      }
    }

    for (const pawn of blackPawns) {
      const hasNeighbor = blackPawns.some(
        (p) => Math.abs(p.file - pawn.file) === 1
      );
      if (!hasNeighbor) {
        patterns.push({
          ...PATTERN_DEFINITIONS.ISOLATED_PAWN,
          id: `isolated-black-${pawn.square}`,
          squares: [pawn.square],
        });
      }
    }

    // Check for passed pawns
    for (const pawn of whitePawns) {
      const isBlocked = blackPawns.some(
        (bp) =>
          Math.abs(bp.file - pawn.file) <= 1 && bp.rank > pawn.rank
      );
      if (!isBlocked) {
        patterns.push({
          ...PATTERN_DEFINITIONS.PASSED_PAWN,
          id: `passed-white-${pawn.square}`,
          squares: [pawn.square],
        });
      }
    }

    for (const pawn of blackPawns) {
      const isBlocked = whitePawns.some(
        (wp) =>
          Math.abs(wp.file - pawn.file) <= 1 && wp.rank < pawn.rank
      );
      if (!isBlocked) {
        patterns.push({
          ...PATTERN_DEFINITIONS.PASSED_PAWN,
          id: `passed-black-${pawn.square}`,
          squares: [pawn.square],
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze king safety patterns
   */
  private analyzeKingSafety(pieces: PiecePosition[]): ChessPattern[] {
    const patterns: ChessPattern[] = [];
    const whiteKing = pieces.find((p) => p.piece === 'K');
    const blackKing = pieces.find((p) => p.piece === 'k');
    const whitePawns = pieces.filter((p) => p.piece === 'P');
    const blackPawns = pieces.filter((p) => p.piece === 'p');

    // Check white king safety
    if (whiteKing) {
      // Castled king (on g1/c1 with pawns in front)
      if (whiteKing.file >= 6 && whiteKing.rank === 1) {
        const hasPawnShield = whitePawns.filter(
          (p) => p.file >= 6 && p.file <= 8 && p.rank === 2
        ).length >= 2;
        if (hasPawnShield) {
          patterns.push({
            ...PATTERN_DEFINITIONS.CASTLED_KING,
            id: 'castled-white-kingside',
            squares: [whiteKing.square],
          });
        }
      } else if (whiteKing.file <= 3 && whiteKing.rank === 1) {
        const hasPawnShield = whitePawns.filter(
          (p) => p.file >= 1 && p.file <= 3 && p.rank === 2
        ).length >= 2;
        if (hasPawnShield) {
          patterns.push({
            ...PATTERN_DEFINITIONS.CASTLED_KING,
            id: 'castled-white-queenside',
            squares: [whiteKing.square],
          });
        }
      }

      // Exposed king in center
      if (whiteKing.file >= 4 && whiteKing.file <= 5 && whiteKing.rank <= 2) {
        const nearbyPawns = whitePawns.filter(
          (p) => Math.abs(p.file - whiteKing.file) <= 1 && p.rank === whiteKing.rank + 1
        );
        if (nearbyPawns.length < 2) {
          patterns.push({
            ...PATTERN_DEFINITIONS.EXPOSED_KING,
            id: 'exposed-white',
            squares: [whiteKing.square],
          });
        }
      }

      // Back rank weakness
      if (whiteKing.rank === 1) {
        const hasEscape = whitePawns.some(
          (p) => Math.abs(p.file - whiteKing.file) <= 1 && p.rank === 2
        ) === false;
        if (!hasEscape) {
          patterns.push({
            ...PATTERN_DEFINITIONS.BACK_RANK_WEAKNESS,
            id: 'backrank-white',
            squares: [whiteKing.square],
          });
        }
      }
    }

    // Similar checks for black king
    if (blackKing) {
      if (blackKing.file >= 6 && blackKing.rank === 8) {
        const hasPawnShield = blackPawns.filter(
          (p) => p.file >= 6 && p.file <= 8 && p.rank === 7
        ).length >= 2;
        if (hasPawnShield) {
          patterns.push({
            ...PATTERN_DEFINITIONS.CASTLED_KING,
            id: 'castled-black-kingside',
            squares: [blackKing.square],
          });
        }
      }

      if (blackKing.rank === 8) {
        const hasEscape = blackPawns.some(
          (p) => Math.abs(p.file - blackKing.file) <= 1 && p.rank === 7
        ) === false;
        if (!hasEscape) {
          patterns.push({
            ...PATTERN_DEFINITIONS.BACK_RANK_WEAKNESS,
            id: 'backrank-black',
            squares: [blackKing.square],
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Analyze piece activity patterns
   */
  private analyzePieceActivity(pieces: PiecePosition[]): ChessPattern[] {
    const patterns: ChessPattern[] = [];
    const whiteBishops = pieces.filter((p) => p.piece === 'B');
    const blackBishops = pieces.filter((p) => p.piece === 'b');
    const whiteRooks = pieces.filter((p) => p.piece === 'R');
    const blackRooks = pieces.filter((p) => p.piece === 'r');
    const allPawns = pieces.filter((p) => p.piece === 'P' || p.piece === 'p');

    // Check for bishop pair
    if (whiteBishops.length === 2) {
      patterns.push({
        ...PATTERN_DEFINITIONS.BISHOP_PAIR,
        id: 'bishop-pair-white',
        squares: whiteBishops.map((b) => b.square),
      });
    }
    if (blackBishops.length === 2) {
      patterns.push({
        ...PATTERN_DEFINITIONS.BISHOP_PAIR,
        id: 'bishop-pair-black',
        squares: blackBishops.map((b) => b.square),
      });
    }

    // Check for fianchetto
    const fianchettoSquares = [
      { square: 'g2', piece: 'B' },
      { square: 'b2', piece: 'B' },
      { square: 'g7', piece: 'b' },
      { square: 'b7', piece: 'b' },
    ];
    for (const { square, piece } of fianchettoSquares) {
      if (pieces.some((p) => p.piece === piece && p.square === square)) {
        patterns.push({
          ...PATTERN_DEFINITIONS.FIANCHETTO,
          id: `fianchetto-${square}`,
          squares: [square],
        });
      }
    }

    // Check for rook on open file
    for (const rook of [...whiteRooks, ...blackRooks]) {
      const pawnsOnFile = allPawns.filter((p) => p.file === rook.file);
      if (pawnsOnFile.length === 0) {
        patterns.push({
          ...PATTERN_DEFINITIONS.ROOK_ON_OPEN_FILE,
          id: `rook-open-${rook.square}`,
          squares: [rook.square],
        });
      }
    }

    // Check for rook on 7th rank
    for (const rook of whiteRooks) {
      if (rook.rank === 7) {
        patterns.push({
          ...PATTERN_DEFINITIONS.ROOK_ON_7TH,
          id: `rook-7th-${rook.square}`,
          squares: [rook.square],
        });
      }
    }
    for (const rook of blackRooks) {
      if (rook.rank === 2) {
        patterns.push({
          ...PATTERN_DEFINITIONS.ROOK_ON_7TH,
          id: `rook-2nd-${rook.square}`,
          squares: [rook.square],
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze tactical patterns
   */
  private analyzeTacticalPatterns(pieces: PiecePosition[]): ChessPattern[] {
    const patterns: ChessPattern[] = [];

    // Simple hanging piece detection
    // A piece is hanging if it's attacked but not defended
    // This is a simplified check - full implementation would need attack/defense maps

    const whitePieces = pieces.filter((p) => p.piece === p.piece.toUpperCase() && p.piece !== 'P' && p.piece !== 'K');
    const _blackPieces = pieces.filter((p) => p.piece === p.piece.toLowerCase() && p.piece !== 'p' && p.piece !== 'k');

    // Check for pieces that might be undefended (simplified)
    for (const piece of whitePieces) {
      const defenders = whitePieces.filter((p) => p.square !== piece.square);
      // Simplified: if no friendly pieces nearby, might be hanging
      const hasSupport = defenders.some(
        (d) => Math.abs(d.file - piece.file) <= 2 && Math.abs(d.rank - piece.rank) <= 2
      );
      if (!hasSupport && PIECE_VALUES[piece.piece] >= 3) {
        patterns.push({
          ...PATTERN_DEFINITIONS.HANGING_PIECE,
          id: `hanging-${piece.square}`,
          squares: [piece.square],
          description: `${piece.piece} on ${piece.square} may be undefended`,
        });
      }
    }

    return patterns;
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(patterns: ChessPattern[]): string {
    if (patterns.length === 0) return 'No significant patterns detected';

    const critical = patterns.filter((p) => p.severity === 'critical');
    const important = patterns.filter((p) => p.severity === 'important');

    if (critical.length > 0) {
      return `Critical: ${critical.map((p) => p.name).join(', ')}`;
    }
    if (important.length > 0) {
      return `Notable: ${important.slice(0, 3).map((p) => p.name).join(', ')}`;
    }
    return `Patterns: ${patterns.slice(0, 3).map((p) => p.name).join(', ')}`;
  }
}

/** Singleton instance */
export const patternService = new PatternService();
