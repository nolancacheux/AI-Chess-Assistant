/**
 * Content Script Entry Point
 * Initializes the Chess AI Assistant when loaded on chess.com
 */

import { ChessAssistant } from './assistant';

/**
 * Initialize the assistant when DOM is ready
 */
function initialize(): void {
  const assistant = new ChessAssistant();
  assistant.initialize();
}

// Wait for DOM to be ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initialize();
} else {
  document.addEventListener('DOMContentLoaded', initialize);
}
