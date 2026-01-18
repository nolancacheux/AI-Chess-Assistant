/**
 * Highlights Component - Manages move highlighting on the board
 */

import type { UCIMove } from '@/types';
import { addKeyframesAnimation, createElement } from '@/utils';
import { fileToCoord } from '@/utils/chess.utils';

const HIGHLIGHT_CLASS = 'suggestion-highlight';

/**
 * Clear all existing highlights from the board
 */
export function clearHighlights(board: Element): void {
  board.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => el.remove());
}

/**
 * Reset piece opacity to default
 */
export function resetPieceOpacity(board: Element): void {
  const allPieces = board.querySelectorAll('.piece');
  allPieces.forEach((piece) => {
    if (piece instanceof HTMLElement) {
      piece.style.opacity = '1';
    }
  });
}

/**
 * Dim all pieces except highlighted ones
 */
export function dimPieces(board: Element, excludeSquares: string[]): void {
  const allPieces = board.querySelectorAll('.piece');
  allPieces.forEach((piece) => {
    if (piece instanceof HTMLElement) {
      const isExcluded = excludeSquares.some((square) =>
        piece.classList.contains(`square-${square}`)
      );
      piece.style.opacity = isExcluded ? '1' : '0.8';
    }
  });
}

/**
 * Display move suggestion highlight on the board
 */
export function displayMoveHighlight(
  move: UCIMove,
  board: Element,
  show: boolean = true
): void {
  // Clear existing highlights
  clearHighlights(board);

  if (!show) {
    resetPieceOpacity(board);
    return;
  }

  // Add pulse animation
  addKeyframesAnimation(
    'pulse',
    `
    0% { box-shadow: 0 0 20px rgba(231, 76, 60, 0.8); }
    50% { box-shadow: 0 0 30px rgba(231, 76, 60, 0.6); }
    100% { box-shadow: 0 0 20px rgba(231, 76, 60, 0.8); }
  `
  );

  // Parse move
  const startFile = fileToCoord(move[0]);
  const startRank = move[1];
  const endFile = fileToCoord(move[2]);
  const endRank = move[3];

  const startSquare = `${startFile}${startRank}`;
  const endSquare = `${endFile}${endRank}`;

  // Dim non-highlighted pieces
  dimPieces(board, [startSquare, endSquare]);

  // Create highlights
  [startSquare, endSquare].forEach((squareCoord) => {
    const highlight = createElement(
      'div',
      {
        border: '4px solid #e74c3c',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        borderRadius: '4px',
        boxShadow: '0 0 20px rgba(231, 76, 60, 0.8)',
        background: 'transparent',
        position: 'absolute',
        zIndex: '1000',
        animation: 'pulse 2s infinite',
      },
      {
        class: `highlight ${HIGHLIGHT_CLASS} square-${squareCoord}`,
      }
    );

    board.appendChild(highlight);
  });
}

/**
 * Create a visual click indicator for debugging
 */
export function showClickIndicator(x: number, y: number, color: string): void {
  const indicator = createElement('div', {
    position: 'fixed',
    width: '15px',
    height: '15px',
    background: color,
    borderRadius: '50%',
    opacity: '0.6',
    pointerEvents: 'none',
    zIndex: '9999',
    transform: 'translate(-50%, -50%)',
    transition: 'opacity 0.5s',
    boxShadow: `0 0 8px ${color}`,
    left: `${x}px`,
    top: `${y}px`,
  });

  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 500);
  }, 800);
}
