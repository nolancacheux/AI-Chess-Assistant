/**
 * AutoPlay Manager - Handles automatic move execution
 */

import { showClickIndicator } from '@/components/highlights.component';
import { boardService } from '@/services';
import type { PlayerColor, UCIMove } from '@/types';
import { dispatchClickSequence } from '@/utils/dom.utils';

const FILE_MAP: Record<string, number> = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  e: 4,
  f: 5,
  g: 6,
  h: 7,
};

const RANK_MAP: Record<number, number> = {
  1: 7,
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 0,
};

/**
 * AutoPlay Manager - Executes moves on the board
 */
export class AutoPlayManager {
  private isActive = false;
  private playerColor: PlayerColor = 'w';

  /**
   * Set player color
   */
  public setPlayerColor(color: PlayerColor): void {
    this.playerColor = color;
  }

  /**
   * Check if auto-play is active
   */
  public isAutoPlayActive(): boolean {
    return this.isActive;
  }

  /**
   * Enable/disable auto-play
   */
  public setActive(active: boolean): void {
    this.isActive = active;
  }

  /**
   * Execute a move on the board
   */
  public executeMove(move: UCIMove): boolean {
    const board = boardService.getBoard();
    if (!board) {
      console.error('[AutoPlay] Board not found');
      return false;
    }

    const queryRoot = boardService.getQueryRoot();
    if (!queryRoot) {
      console.error('[AutoPlay] Query root not found');
      return false;
    }

    try {
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);

      const fromFile = FILE_MAP[from[0]];
      const fromRank = parseInt(from[1]);
      const toFile = FILE_MAP[to[0]];
      const toRank = parseInt(to[1]);

      // Find source piece
      const fromElement = this.findPieceElement(queryRoot, fromFile, fromRank);
      const svgTarget = queryRoot.querySelector('svg.coordinates');

      if (!fromElement || !svgTarget) {
        console.error('[AutoPlay] Could not find elements');
        return false;
      }

      const boardRect = board.getBoundingClientRect();
      const squareWidth = boardRect.width / 8;
      const squareHeight = boardRect.height / 8;

      // Calculate coordinates
      const fromRect = fromElement.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2;
      const fromY = fromRect.top + fromRect.height / 2;

      const { x: toX, y: toY } = this.calculateTargetCoords(
        boardRect,
        squareWidth,
        squareHeight,
        toFile,
        toRank
      );

      // Execute click sequence
      showClickIndicator(fromX, fromY, '#e74c3c');
      dispatchClickSequence(fromElement, fromX, fromY);

      setTimeout(() => {
        showClickIndicator(toX, toY, '#2ecc71');
        dispatchClickSequence(svgTarget, toX, toY);
      }, 150);

      return true;
    } catch (error) {
      console.error('[AutoPlay] Error executing move:', error);
      return false;
    }
  }

  /**
   * Check if game has ended
   */
  public isGameOver(): boolean {
    const gameEndMarkers = document.querySelectorAll('.notation-result-component');
    const resultText = document.querySelector('.vertical-result-component');

    return (
      gameEndMarkers.length > 0 || (resultText?.textContent?.includes('Game') ?? false)
    );
  }

  /**
   * Find piece element on the board
   */
  private findPieceElement(
    queryRoot: Element | ShadowRoot,
    file: number,
    rank: number
  ): Element | null {
    // Try normal format first
    let element = queryRoot.querySelector(`.piece.square-${file + 1}${rank}`);

    // Try flipped board (for black)
    if (!element && this.playerColor === 'b') {
      element = queryRoot.querySelector(`.piece.square-${8 - file}${rank}`);
    }

    // Try alternative selector
    if (!element) {
      element = queryRoot.querySelector(`.piece[class*="square-${file + 1}${rank}"]`);
    }

    return element;
  }

  /**
   * Calculate target coordinates based on player color
   */
  private calculateTargetCoords(
    boardRect: DOMRect,
    squareWidth: number,
    squareHeight: number,
    toFile: number,
    toRank: number
  ): { x: number; y: number } {
    if (this.playerColor === 'w') {
      return {
        x: boardRect.left + toFile * squareWidth + squareWidth / 2,
        y: boardRect.top + RANK_MAP[toRank] * squareHeight + squareHeight / 2,
      };
    } else {
      return {
        x: boardRect.left + (7 - toFile) * squareWidth + squareWidth / 2,
        y: boardRect.top + (7 - RANK_MAP[toRank]) * squareHeight + squareHeight / 2,
      };
    }
  }
}
