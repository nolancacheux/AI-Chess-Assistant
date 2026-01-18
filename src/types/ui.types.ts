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

/** Default theme */
export const DEFAULT_THEME: ThemeColors = {
  primary: '#2c3e50',
  secondary: '#34495e',
  accent: '#e74c3c',
  background: '#f8f9fa',
  surface: '#ecf0f1',
  text: '#2c3e50',
  textMuted: '#7f8c8d',
  border: '#e9ecef',
  success: '#2ecc71',
  warning: '#f39c12',
  error: '#e74c3c',
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
