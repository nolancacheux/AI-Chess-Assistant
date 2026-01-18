/**
 * Board Service - Handles chess board detection and FEN generation
 */

import type { FENString, PlayerColor } from '@/types';

/** Chess.com board element type */
type ChessBoardElement = HTMLElement & {
  shadowRoot?: ShadowRoot;
};

/**
 * Board Service - Manages interaction with chess.com board
 */
export class BoardService {
  private boardElement: ChessBoardElement | null = null;
  private lastBoardState: FENString = '';

  /**
   * Find and cache the chess board element
   */
  public findBoard(): boolean {
    this.boardElement = document.querySelector('wc-chess-board');
    return this.boardElement !== null;
  }

  /**
   * Get the board element
   */
  public getBoard(): ChessBoardElement | null {
    return this.boardElement;
  }

  /**
   * Get the query root (shadow DOM or regular DOM)
   */
  public getQueryRoot(): Element | ShadowRoot | null {
    if (!this.boardElement) return null;
    return this.boardElement.shadowRoot ?? this.boardElement;
  }

  /**
   * Generate FEN string from current board position
   */
  public generateFEN(): FENString {
    if (!this.boardElement) return '';

    let fen = '';
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    const files = [1, 2, 3, 4, 5, 6, 7, 8];

    for (const rank of ranks) {
      let emptySquareCount = 0;

      for (const file of files) {
        const squareSelector = `.piece.square-${file}${rank}`;
        const pieceElement = this.boardElement.querySelector(squareSelector);

        if (pieceElement) {
          if (emptySquareCount > 0) {
            fen += emptySquareCount;
            emptySquareCount = 0;
          }

          const pieceSymbol = this.getPieceSymbol(pieceElement);
          if (pieceSymbol) {
            fen += pieceSymbol;
          }
        } else {
          emptySquareCount++;
        }
      }

      if (emptySquareCount > 0) {
        fen += emptySquareCount;
      }

      if (rank > 1) {
        fen += '/';
      }
    }

    return fen;
  }

  /**
   * Generate full FEN with turn marker
   */
  public generateFullFEN(turnMarker: PlayerColor): FENString {
    return `${this.generateFEN()} ${turnMarker}`;
  }

  /**
   * Check if board state has changed
   */
  public hasBoardChanged(): boolean {
    const currentState = this.generateFEN();
    const hasChanged = currentState !== this.lastBoardState;

    if (hasChanged) {
      this.lastBoardState = currentState;
    }

    return hasChanged;
  }

  /**
   * Get the last known board state
   */
  public getLastBoardState(): FENString {
    return this.lastBoardState;
  }

  /**
   * Update the last board state
   */
  public updateLastBoardState(): void {
    this.lastBoardState = this.generateFEN();
  }

  /**
   * Get board rectangle for coordinate calculations
   */
  public getBoardRect(): DOMRect | null {
    return this.boardElement?.getBoundingClientRect() ?? null;
  }

  /**
   * Find piece element at given square
   */
  public findPieceAt(file: number, rank: number): Element | null {
    const queryRoot = this.getQueryRoot();
    if (!queryRoot) return null;

    return queryRoot.querySelector(`.piece.square-${file}${rank}`);
  }

  /**
   * Find SVG coordinates overlay
   */
  public findSVGOverlay(): Element | null {
    const queryRoot = this.getQueryRoot();
    if (!queryRoot) return null;

    return queryRoot.querySelector('svg.coordinates');
  }

  /**
   * Add visual border to board
   */
  public addBoardBorder(): void {
    const boardLayout = document.querySelector('.board-layout-chessboard');
    if (boardLayout instanceof HTMLElement) {
      boardLayout.style.border = '2px solid #2c3e50';
      boardLayout.style.borderRadius = '4px';
    }
  }

  /**
   * Extract piece symbol from element classes
   */
  private getPieceSymbol(element: Element): string | null {
    for (const cssClass of element.classList) {
      if (cssClass.length === 2 && /^[wb][prnbqk]$/.test(cssClass)) {
        const color = cssClass[0];
        const piece = cssClass[1];
        return color === 'w' ? piece.toUpperCase() : piece.toLowerCase();
      }
    }
    return null;
  }
}

/** Singleton instance */
export const boardService = new BoardService();
