/**
 * ML-Based Position Evaluation Service
 * Demonstrates feature extraction and weighted scoring for position evaluation
 */

import type { FENString } from '@/types';

/** Feature weights learned from training data (simulated) */
const FEATURE_WEIGHTS = {
  material: 1.0,
  piecePlacement: 0.4,
  kingSafety: 0.35,
  mobility: 0.25,
  pawnStructure: 0.3,
  centerControl: 0.2,
};

/** Piece-square tables for positional evaluation (centipawns) */
const PIECE_SQUARE_TABLES: Record<string, number[][]> = {
  P: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  N: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  B: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  R: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  Q: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  K: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
};

/** Piece material values */
const MATERIAL_VALUES: Record<string, number> = {
  P: 100,
  N: 320,
  B: 330,
  R: 500,
  Q: 900,
  K: 0,
};

/** Extracted features from position */
export interface PositionFeatures {
  material: number;
  piecePlacement: number;
  kingSafety: number;
  mobility: number;
  pawnStructure: number;
  centerControl: number;
}

/** ML evaluation result */
export interface MLEvaluation {
  features: PositionFeatures;
  normalizedFeatures: PositionFeatures;
  weightedScore: number;
  winProbability: number;
  confidence: number;
  featureImportance: Array<{ name: string; impact: number; value: number }>;
}

/**
 * ML-Based Position Evaluation Service
 */
export class EvaluationService {
  /**
   * Evaluate position using ML-inspired feature extraction
   */
  public evaluatePosition(fen: FENString): MLEvaluation {
    const features = this.extractFeatures(fen);
    const normalizedFeatures = this.normalizeFeatures(features);
    const weightedScore = this.calculateWeightedScore(normalizedFeatures);
    const winProbability = this.scoreToWinProbability(weightedScore);
    const confidence = this.calculateConfidence(features);
    const featureImportance = this.calculateFeatureImportance(normalizedFeatures);

    return {
      features,
      normalizedFeatures,
      weightedScore,
      winProbability,
      confidence,
      featureImportance,
    };
  }

  /**
   * Extract raw features from position
   */
  private extractFeatures(fen: string): PositionFeatures {
    const position = fen.split(' ')[0];
    const ranks = position.split('/');

    let material = 0;
    let piecePlacement = 0;
    let kingSafety = 0;
    let centerControl = 0;

    const whitePawns: Array<{ file: number; rank: number }> = [];
    const blackPawns: Array<{ file: number; rank: number }> = [];
    let whiteKingPos: { file: number; rank: number } | null = null;
    let blackKingPos: { file: number; rank: number } | null = null;

    // Parse position
    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      const rank = ranks[rankIndex];
      let fileIndex = 0;

      for (const char of rank) {
        if (/[1-8]/.test(char)) {
          fileIndex += parseInt(char);
        } else {
          const isWhite = char === char.toUpperCase();
          const pieceType = char.toUpperCase();
          const actualRank = 8 - rankIndex;

          // Material
          const materialValue = MATERIAL_VALUES[pieceType] || 0;
          material += isWhite ? materialValue : -materialValue;

          // Piece-square value
          const table = PIECE_SQUARE_TABLES[pieceType];
          if (table) {
            const tableRank = isWhite ? rankIndex : 7 - rankIndex;
            const psValue = table[tableRank][fileIndex];
            piecePlacement += isWhite ? psValue : -psValue;
          }

          // Track pawns and kings
          if (pieceType === 'P') {
            if (isWhite) {
              whitePawns.push({ file: fileIndex, rank: actualRank });
            } else {
              blackPawns.push({ file: fileIndex, rank: actualRank });
            }
          } else if (pieceType === 'K') {
            if (isWhite) {
              whiteKingPos = { file: fileIndex, rank: actualRank };
            } else {
              blackKingPos = { file: fileIndex, rank: actualRank };
            }
          }

          // Center control bonus
          if ((fileIndex === 3 || fileIndex === 4) && (actualRank === 4 || actualRank === 5)) {
            centerControl += isWhite ? 10 : -10;
          }

          fileIndex++;
        }
      }
    }

    // King safety evaluation
    if (whiteKingPos) {
      kingSafety += this.evaluateKingSafety(whiteKingPos, whitePawns, true);
    }
    if (blackKingPos) {
      kingSafety -= this.evaluateKingSafety(blackKingPos, blackPawns, false);
    }

    // Pawn structure
    const pawnStructure = this.evaluatePawnStructure(whitePawns, blackPawns);

    // Simplified mobility (based on piece count and position)
    const mobility = this.estimateMobility(fen);

    return {
      material,
      piecePlacement,
      kingSafety,
      mobility,
      pawnStructure,
      centerControl,
    };
  }

  /**
   * Evaluate king safety
   */
  private evaluateKingSafety(
    kingPos: { file: number; rank: number },
    friendlyPawns: Array<{ file: number; rank: number }>,
    isWhite: boolean
  ): number {
    let safety = 0;

    // Castled king bonus
    if (isWhite) {
      if (kingPos.rank === 1 && (kingPos.file >= 6 || kingPos.file <= 2)) {
        safety += 30;
      }
    } else {
      if (kingPos.rank === 8 && (kingPos.file >= 6 || kingPos.file <= 2)) {
        safety += 30;
      }
    }

    // Pawn shield
    const expectedPawnRank = isWhite ? 2 : 7;
    const pawnShield = friendlyPawns.filter(
      (p) => Math.abs(p.file - kingPos.file) <= 1 && p.rank === expectedPawnRank
    ).length;
    safety += pawnShield * 15;

    // King in center penalty
    if (kingPos.file >= 3 && kingPos.file <= 4) {
      safety -= 20;
    }

    return safety;
  }

  /**
   * Evaluate pawn structure
   */
  private evaluatePawnStructure(
    whitePawns: Array<{ file: number; rank: number }>,
    blackPawns: Array<{ file: number; rank: number }>
  ): number {
    let score = 0;

    // Check for doubled pawns
    for (let file = 0; file < 8; file++) {
      const whiteOnFile = whitePawns.filter((p) => p.file === file).length;
      const blackOnFile = blackPawns.filter((p) => p.file === file).length;
      if (whiteOnFile > 1) score -= 15 * (whiteOnFile - 1);
      if (blackOnFile > 1) score += 15 * (blackOnFile - 1);
    }

    // Check for isolated pawns
    for (const pawn of whitePawns) {
      const hasNeighbor = whitePawns.some((p) => Math.abs(p.file - pawn.file) === 1);
      if (!hasNeighbor) score -= 10;
    }
    for (const pawn of blackPawns) {
      const hasNeighbor = blackPawns.some((p) => Math.abs(p.file - pawn.file) === 1);
      if (!hasNeighbor) score += 10;
    }

    // Check for passed pawns
    for (const pawn of whitePawns) {
      const isBlocked = blackPawns.some(
        (bp) => Math.abs(bp.file - pawn.file) <= 1 && bp.rank > pawn.rank
      );
      if (!isBlocked) score += 20 + (pawn.rank - 2) * 10;
    }
    for (const pawn of blackPawns) {
      const isBlocked = whitePawns.some(
        (wp) => Math.abs(wp.file - pawn.file) <= 1 && wp.rank < pawn.rank
      );
      if (!isBlocked) score -= 20 + (7 - pawn.rank) * 10;
    }

    return score;
  }

  /**
   * Estimate mobility (simplified)
   */
  private estimateMobility(fen: string): number {
    const position = fen.split(' ')[0];
    let whiteMinors = 0;
    let blackMinors = 0;

    for (const char of position) {
      if (char === 'N' || char === 'B') whiteMinors++;
      if (char === 'n' || char === 'b') blackMinors++;
      if (char === 'R') whiteMinors += 2;
      if (char === 'r') blackMinors += 2;
      if (char === 'Q') whiteMinors += 4;
      if (char === 'q') blackMinors += 4;
    }

    // More pieces = more potential mobility
    return (whiteMinors - blackMinors) * 5;
  }

  /**
   * Normalize features to [-1, 1] range
   */
  private normalizeFeatures(features: PositionFeatures): PositionFeatures {
    return {
      material: this.sigmoid(features.material / 1000),
      piecePlacement: this.sigmoid(features.piecePlacement / 200),
      kingSafety: this.sigmoid(features.kingSafety / 100),
      mobility: this.sigmoid(features.mobility / 50),
      pawnStructure: this.sigmoid(features.pawnStructure / 100),
      centerControl: this.sigmoid(features.centerControl / 50),
    };
  }

  /**
   * Sigmoid function for normalization
   */
  private sigmoid(x: number): number {
    return 2 / (1 + Math.exp(-x)) - 1;
  }

  /**
   * Calculate weighted score from normalized features
   */
  private calculateWeightedScore(features: PositionFeatures): number {
    return (
      features.material * FEATURE_WEIGHTS.material +
      features.piecePlacement * FEATURE_WEIGHTS.piecePlacement +
      features.kingSafety * FEATURE_WEIGHTS.kingSafety +
      features.mobility * FEATURE_WEIGHTS.mobility +
      features.pawnStructure * FEATURE_WEIGHTS.pawnStructure +
      features.centerControl * FEATURE_WEIGHTS.centerControl
    );
  }

  /**
   * Convert score to win probability using logistic function
   */
  private scoreToWinProbability(score: number): number {
    // Logistic function to convert score to probability
    return 1 / (1 + Math.exp(-score * 2.5));
  }

  /**
   * Calculate confidence based on feature magnitudes
   */
  private calculateConfidence(features: PositionFeatures): number {
    // Higher absolute values = more decisive position = higher confidence
    const totalMagnitude =
      Math.abs(features.material) / 1000 +
      Math.abs(features.piecePlacement) / 200 +
      Math.abs(features.kingSafety) / 100;

    return Math.min(0.95, 0.5 + totalMagnitude * 0.15);
  }

  /**
   * Calculate feature importance for explainability
   */
  private calculateFeatureImportance(
    features: PositionFeatures
  ): Array<{ name: string; impact: number; value: number }> {
    const importance = [
      {
        name: 'Material',
        impact: features.material * FEATURE_WEIGHTS.material,
        value: features.material,
      },
      {
        name: 'Piece Placement',
        impact: features.piecePlacement * FEATURE_WEIGHTS.piecePlacement,
        value: features.piecePlacement,
      },
      {
        name: 'King Safety',
        impact: features.kingSafety * FEATURE_WEIGHTS.kingSafety,
        value: features.kingSafety,
      },
      {
        name: 'Mobility',
        impact: features.mobility * FEATURE_WEIGHTS.mobility,
        value: features.mobility,
      },
      {
        name: 'Pawn Structure',
        impact: features.pawnStructure * FEATURE_WEIGHTS.pawnStructure,
        value: features.pawnStructure,
      },
      {
        name: 'Center Control',
        impact: features.centerControl * FEATURE_WEIGHTS.centerControl,
        value: features.centerControl,
      },
    ];

    // Sort by absolute impact
    return importance.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }
}

/** Singleton instance */
export const evaluationService = new EvaluationService();
