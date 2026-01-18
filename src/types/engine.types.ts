/**
 * Engine Types - Type definitions for Stockfish engine communication
 */

import type { Depth, Score, UCIMove } from './chess.types';

/** Engine state */
export type EngineState = 'idle' | 'analyzing' | 'stopped' | 'error';

/** Engine configuration */
export interface EngineConfig {
  /** Path to Stockfish worker script */
  workerPath: string;
  /** Default analysis depth */
  defaultDepth: Depth;
  /** Analysis depth for auto-play (lower for faster response) */
  autoPlayDepth: Depth;
}

/** Engine analysis result */
export interface EngineAnalysis {
  bestMove: UCIMove | null;
  score: Score | null;
  depth: Depth;
  pv: UCIMove[]; // Principal variation
}

/** Engine info message parsed data */
export interface EngineInfoMessage {
  depth?: Depth;
  score?: Score;
  pv?: string;
  nodes?: number;
  nps?: number;
  time?: number;
}

/** Engine event types */
export type EngineEventType = 'bestmove' | 'info' | 'ready' | 'error';

/** Engine event callback */
export interface EngineEvent {
  type: EngineEventType;
  data: EngineAnalysis | EngineInfoMessage | Error | null;
}

/** Engine event listener */
export type EngineEventListener = (event: EngineEvent) => void;

/** Default engine configuration */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  workerPath: '/bundles/app/js/vendor/jschessengine/stockfish.asm.1abfa10c.js',
  defaultDepth: 15,
  autoPlayDepth: 2,
};
