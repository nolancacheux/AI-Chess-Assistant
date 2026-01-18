/**
 * UI Types - Type definitions for user interface components
 */

import type { PlayerColor } from './chess.types';

/** Assistant activation state */
export type AssistantState = 'inactive' | 'selecting_color' | 'active' | 'error';

/** UI theme colors */
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

/** Default theme - Modern dark theme */
export const DEFAULT_THEME: ThemeColors = {
  primary: '#6366f1',    // Indigo
  secondary: '#818cf8',  // Light indigo
  accent: '#22d3ee',     // Cyan
  background: '#0f172a', // Slate 900
  surface: '#1e293b',    // Slate 800
  text: '#f1f5f9',       // Slate 100
  textMuted: '#94a3b8',  // Slate 400
  border: '#334155',     // Slate 700
  success: '#22c55e',    // Green
  warning: '#f59e0b',    // Amber
  error: '#ef4444',      // Red
};

/** Panel visibility state */
export interface PanelState {
  isVisible: boolean;
  isCollapsed: boolean;
  position: { x: number; y: number };
}

/** UI update event */
export interface UIUpdateEvent {
  type: 'status' | 'analysis' | 'advantage' | 'highlight';
  data: unknown;
}

/** Color selection callback */
export type ColorSelectionCallback = (color: PlayerColor) => void;

/** Button configuration */
export interface ButtonConfig {
  id: string;
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}
