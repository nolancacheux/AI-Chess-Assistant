/**
 * Chess Assistant - Board Module
 * Handles board detection, FEN generation, and board state queries
 * @module board
 */

window.ChessAssistant = window.ChessAssistant || {};

window.ChessAssistant.Board = (function() {
    const Config = window.ChessAssistant.Config;
    const State = window.ChessAssistant.State;

    /**
     * Find and validate the chess board element
     * @returns {Element|null} Chess board element or null if not found
     */
    function findChessBoard() {
        const board = document.querySelector(Config.SELECTORS.CHESS_BOARD);
        if (!board) {
            console.error('Chess Assistant: Chessboard element not found');
            return null;
        }
        return board;
    }

    /**
     * Get the query root for board elements (handles shadow DOM)
     * @param {Element} board - Chess board element
     * @returns {Element|ShadowRoot} Query root
     */
    function getQueryRoot(board) {
        return board.shadowRoot || board;
    }

    /**
     * Extract piece symbol from element class list
     * @param {Element} pieceElement - Piece DOM element
     * @returns {string|null} Piece symbol or null
     */
    function extractPieceSymbol(pieceElement) {
        for (const cssClass of pieceElement.classList) {
            if (cssClass.length === 2 && Config.PIECE_PATTERN.test(cssClass)) {
                return cssClass;
            }
        }
        return null;
    }

    /**
     * Convert piece symbol to FEN character
     * @param {string} symbol - Piece symbol (e.g., 'wp', 'bk')
     * @returns {string} FEN character
     */
    function pieceSymbolToFEN(symbol) {
        const piece = symbol[1];
        return symbol[0] === 'w' ? piece.toUpperCase() : piece.toLowerCase();
    }

    /**
     * Generate FEN string from current board position
     * @returns {string} FEN position string (without turn/castling info)
     */
    function generateFENString() {
        const board = State.chessBoardElement;
        if (!board) return '';

        let fen = '';
        const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
        const files = [1, 2, 3, 4, 5, 6, 7, 8];

        for (const rank of ranks) {
            let emptySquareCount = 0;

            for (const file of files) {
                const squareSelector = `.piece.square-${file}${rank}`;
                const pieceElement = board.querySelector(squareSelector);

                if (pieceElement) {
                    if (emptySquareCount > 0) {
                        fen += emptySquareCount;
                        emptySquareCount = 0;
                    }

                    const pieceSymbol = extractPieceSymbol(pieceElement);
                    if (pieceSymbol) {
                        fen += pieceSymbolToFEN(pieceSymbol);
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
     * Get full FEN with turn marker
     * @param {string} turnMarker - 'w' or 'b'
     * @returns {string} Full FEN string
     */
    function getFullFEN(turnMarker) {
        return `${generateFENString()} ${turnMarker}`;
    }

    /**
     * Parse move notation to get source and destination squares
     * @param {string} move - Move in algebraic notation (e.g., 'e2e4')
     * @returns {Object} Object with from and to squares
     */
    function parseMove(move) {
        return {
            from: move.substring(0, 2),
            to: move.substring(2, 4),
            promotion: move.length > 4 ? move[4] : null
        };
    }

    /**
     * Convert algebraic square to file and rank numbers
     * @param {string} square - Algebraic notation (e.g., 'e2')
     * @returns {Object} Object with file (0-7) and rank (1-8)
     */
    function squareToCoordinates(square) {
        return {
            file: Config.FILE_MAP[square[0]],
            rank: parseInt(square[1])
        };
    }

    /**
     * Find a piece element on the board
     * @param {string} square - Algebraic notation (e.g., 'e2')
     * @returns {Element|null} Piece element or null
     */
    function findPieceAtSquare(square) {
        const board = State.chessBoardElement;
        if (!board) return null;

        const queryRoot = getQueryRoot(board);
        const coords = squareToCoordinates(square);

        // Try standard format
        let piece = queryRoot.querySelector(`.piece.square-${coords.file + 1}${coords.rank}`);

        // Try black perspective (inverted)
        if (!piece && State.playerColor === 'b') {
            piece = queryRoot.querySelector(`.piece.square-${8 - coords.file}${coords.rank}`);
        }

        // Try with attribute selector
        if (!piece) {
            piece = queryRoot.querySelector(`.piece[class*="square-${coords.file + 1}${coords.rank}"]`);
        }

        return piece;
    }

    /**
     * Calculate screen coordinates for a square
     * @param {string} square - Algebraic notation (e.g., 'e2')
     * @returns {Object|null} Object with x and y screen coordinates
     */
    function getSquareScreenCoordinates(square) {
        const board = State.chessBoardElement;
        if (!board) return null;

        const boardRect = board.getBoundingClientRect();
        const squareWidth = boardRect.width / Config.BOARD.SIZE;
        const squareHeight = boardRect.height / Config.BOARD.SIZE;

        const coords = squareToCoordinates(square);
        let x, y;

        if (State.playerColor === 'w') {
            // White perspective (a1 is bottom-left)
            x = boardRect.left + (coords.file * squareWidth) + (squareWidth / 2);
            y = boardRect.top + (Config.RANK_MAP[coords.rank] * squareHeight) + (squareHeight / 2);
        } else {
            // Black perspective (a1 is top-right)
            x = boardRect.left + ((7 - coords.file) * squareWidth) + (squareWidth / 2);
            y = boardRect.top + ((7 - Config.RANK_MAP[coords.rank]) * squareHeight) + (squareHeight / 2);
        }

        return { x, y };
    }

    /**
     * Get the SVG overlay element for move targeting
     * @returns {Element|null} SVG element or null
     */
    function getSVGOverlay() {
        const board = State.chessBoardElement;
        if (!board) return null;

        const queryRoot = getQueryRoot(board);
        return queryRoot.querySelector(Config.SELECTORS.SVG_COORDINATES);
    }

    /**
     * Add visual styling to the board
     */
    function addBoardStyling() {
        const boardLayout = document.querySelector(Config.SELECTORS.BOARD_LAYOUT);
        if (boardLayout) {
            boardLayout.style.border = '2px solid #2c3e50';
            boardLayout.style.borderRadius = '4px';
        }
    }

    /**
     * Check if the game appears to be over
     * @returns {boolean} True if game is over
     */
    function isGameOver() {
        const gameEndMarkers = document.querySelectorAll(Config.SELECTORS.GAME_END_MARKERS);
        const resultText = document.querySelector(Config.SELECTORS.RESULT_TEXT);

        return gameEndMarkers.length > 0 ||
               (resultText && resultText.textContent.includes('Game'));
    }

    /**
     * Check if promotion dialog is visible
     * @returns {boolean} True if promotion dialog is visible
     */
    function isPromotionDialogVisible() {
        const promotionBox = document.querySelector(Config.SELECTORS.PROMOTION_BOX);
        return promotionBox && window.getComputedStyle(promotionBox).display !== 'none';
    }

    /**
     * Get promotion pieces from the dialog
     * @returns {NodeList|null} List of promotion piece elements
     */
    function getPromotionPieces() {
        const promotionBox = document.querySelector(Config.SELECTORS.PROMOTION_BOX);
        if (!promotionBox) return null;
        return promotionBox.querySelectorAll(Config.SELECTORS.PROMOTION_PIECE);
    }

    // Public API
    return {
        findChessBoard,
        getQueryRoot,
        generateFENString,
        getFullFEN,
        parseMove,
        squareToCoordinates,
        findPieceAtSquare,
        getSquareScreenCoordinates,
        getSVGOverlay,
        addBoardStyling,
        isGameOver,
        isPromotionDialogVisible,
        getPromotionPieces
    };
})();

console.log('Chess Assistant: Board module loaded');
