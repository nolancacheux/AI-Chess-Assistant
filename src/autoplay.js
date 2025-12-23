/**
 * Chess Assistant - Auto Play Module
 * Handles automatic move execution through simulated mouse events
 * @module autoplay
 */

window.ChessAssistant = window.ChessAssistant || {};

window.ChessAssistant.AutoPlay = (function() {
    const Config = window.ChessAssistant.Config;
    const State = window.ChessAssistant.State;
    const Board = window.ChessAssistant.Board;
    const Engine = window.ChessAssistant.Engine;
    const UI = window.ChessAssistant.UI;

    /**
     * Create a visual click indicator for debugging
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} color - CSS color
     */
    function createClickIndicator(x, y, color) {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            width: 15px;
            height: 15px;
            background: ${color};
            border-radius: 50%;
            opacity: 0.6;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: opacity 0.5s;
            box-shadow: 0 0 8px ${color};
            left: ${x}px;
            top: ${y}px;
        `;
        document.body.appendChild(indicator);

        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 500);
        }, 800);
    }

    /**
     * Create a pointer event
     * @param {string} type - Event type
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {PointerEvent} Pointer event
     */
    function createPointerEvent(type, x, y) {
        return new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons: type === 'pointerdown' ? 1 : 0,
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            pointerId: 1,
            width: 1,
            height: 1,
            pressure: 0.5,
            isPrimary: true,
            pointerType: 'mouse'
        });
    }

    /**
     * Create a mouse event
     * @param {string} type - Event type
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {MouseEvent} Mouse event
     */
    function createMouseEvent(type, x, y) {
        return new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons: type === 'mousedown' ? 1 : 0,
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            detail: 1
        });
    }

    /**
     * Dispatch a full click sequence to an element
     * @param {Element} element - Target element
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    function dispatchClickSequence(element, x, y) {
        element.dispatchEvent(createPointerEvent('pointerdown', x, y));
        element.dispatchEvent(createMouseEvent('mousedown', x, y));
        element.dispatchEvent(createPointerEvent('pointerup', x, y));
        element.dispatchEvent(createMouseEvent('mouseup', x, y));
        element.dispatchEvent(createPointerEvent('click', x, y));
        element.dispatchEvent(createMouseEvent('click', x, y));
    }

    /**
     * Check if a move is a pawn promotion
     * @param {string} from - Source square
     * @param {string} to - Destination square
     * @returns {boolean} True if promotion move
     */
    function isPromotionMove(from, to) {
        const isWhitePromotion = State.playerColor === 'w' &&
                                  from[1] === '7' && to[1] === '8';
        const isBlackPromotion = State.playerColor === 'b' &&
                                  from[1] === '2' && to[1] === '1';

        return isWhitePromotion || isBlackPromotion;
    }

    /**
     * Handle pawn promotion dialog
     * @returns {boolean} True if promotion was handled
     */
    function handlePromotion() {
        if (!Board.isPromotionDialogVisible()) return false;

        const promotionPieces = Board.getPromotionPieces();
        if (!promotionPieces || promotionPieces.length === 0) return false;

        console.log('%cAuto-play: Handling pawn promotion', 'color: #9b59b6; font-weight: bold');

        // Select queen (typically first option)
        const queen = promotionPieces[0];
        const rect = queen.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        createClickIndicator(x, y, '#9b59b6');
        dispatchClickSequence(queen, x, y);

        return true;
    }

    /**
     * Find the move to execute
     * @returns {Object|null} Move entry or null
     */
    function findMoveToExecute() {
        // First check UI for suggested move
        const statusElement = document.getElementById(Config.PANEL_IDS.STATUS);
        if (statusElement) {
            const statusText = statusElement.textContent;
            const moveMatch = statusText.match(/Suggested Move: ([a-h][1-8][a-h][1-8])/);
            if (moveMatch && moveMatch[1]) {
                console.log('%cAuto-play: Found suggested move in UI: ' + moveMatch[1],
                            'color: #2ecc71; font-weight: bold');
                return {
                    move: moveMatch[1],
                    timestamp: new Date().toISOString(),
                    depth: 99,
                    isFinal: true
                };
            }
        }

        // Fall back to engine's best move
        return Engine.getBestMove(true);
    }

    /**
     * Execute the move on the board
     * @param {string} move - Move notation (e.g., 'e2e4')
     */
    function executeMove(move) {
        const board = State.chessBoardElement;
        if (!board) {
            console.error('Auto-play: Chess board not found');
            return;
        }

        const parsed = Board.parseMove(move);
        const from = parsed.from;
        const to = parsed.to;

        console.log(`%cAuto-play: Executing move ${from} -> ${to}`,
                    'color: #2ecc71; font-weight: bold');

        // Check for possible promotion
        if (isPromotionMove(from, to)) {
            console.log('%cAuto-play: Detected possible pawn promotion!',
                        'color: #e74c3c; font-weight: bold');
        }

        // Try custom board-move event (low confidence)
        try {
            const boardMoveEvent = new CustomEvent('board-move', {
                detail: { from, to },
                bubbles: true,
                cancelable: true
            });
            board.dispatchEvent(boardMoveEvent);
        } catch (e) {
            console.log('Auto-play: Custom event method failed:', e);
        }

        // Try board.move() method (low confidence)
        if (typeof board.move === 'function') {
            try {
                board.move(from, to);
            } catch (e) {
                console.log('Auto-play: board.move() method failed:', e);
            }
        }

        // Simulate manual click sequence (high confidence)
        simulateManualMove(from, to);
    }

    /**
     * Simulate a manual move through click events
     * @param {string} from - Source square
     * @param {string} to - Destination square
     */
    function simulateManualMove(from, to) {
        const board = State.chessBoardElement;
        const queryRoot = Board.getQueryRoot(board);

        // Find source piece
        const fromPiece = Board.findPieceAtSquare(from);
        const svgTarget = Board.getSVGOverlay();

        if (!fromPiece || !svgTarget) {
            console.error('Auto-play: Could not find source piece or target SVG');
            logBoardState(queryRoot);
            return;
        }

        // Get coordinates
        const fromRect = fromPiece.getBoundingClientRect();
        const fromX = fromRect.left + fromRect.width / 2;
        const fromY = fromRect.top + fromRect.height / 2;

        const toCoords = Board.getSquareScreenCoordinates(to);
        if (!toCoords) {
            console.error('Auto-play: Could not calculate target coordinates');
            return;
        }

        console.log(`Auto-play: Source coords (${fromX.toFixed(1)}, ${fromY.toFixed(1)})`);
        console.log(`Auto-play: Target coords (${toCoords.x.toFixed(1)}, ${toCoords.y.toFixed(1)})`);

        // Click source piece
        createClickIndicator(fromX, fromY, '#e74c3c');
        dispatchClickSequence(fromPiece, fromX, fromY);

        // Click destination after delay
        setTimeout(() => {
            createClickIndicator(toCoords.x, toCoords.y, '#2ecc71');
            dispatchClickSequence(svgTarget, toCoords.x, toCoords.y);

            // Handle post-move state
            handlePostMove();
        }, Config.TIMING.MOVE_SEQUENCE_DELAY);
    }

    /**
     * Handle state after move execution
     */
    function handlePostMove() {
        setTimeout(() => {
            // Check for promotion dialog
            if (Board.isPromotionDialogVisible()) {
                console.log('%cAuto-play: Promotion dialog detected',
                            'color: #9b59b6; font-weight: bold');
                handlePromotion();

                // Additional delay after promotion
                setTimeout(updateBoardStateAfterMove, Config.TIMING.PROMOTION_DELAY);
            } else {
                updateBoardStateAfterMove();
            }
        }, Config.TIMING.POST_MOVE_DELAY);
    }

    /**
     * Update board state after move completion
     */
    function updateBoardStateAfterMove() {
        console.log('%cAuto-play: Updating board state after move',
                    'color: #3498db; font-weight: bold');

        const currentFEN = Board.generateFENString();
        if (currentFEN) {
            State.lastOpponentBoardState = currentFEN;
            State.waitingForOpponentMove = true;
            UI.updateStatus("Opponent's turn - waiting...");
            console.log('%cAuto-play: Now waiting for opponent\'s move',
                        'color: #3498db');
        }
    }

    /**
     * Log board state for debugging
     * @param {Element|ShadowRoot} queryRoot - Query root
     */
    function logBoardState(queryRoot) {
        const pieces = queryRoot.querySelectorAll('.piece');
        if (pieces.length > 0) {
            console.log('Auto-play: Found', pieces.length, 'pieces on board');
            console.log('Auto-play: Piece classes:',
                        Array.from(pieces).map(el => el.className));
        } else {
            console.error('Auto-play: No pieces found on board');
        }
    }

    /**
     * Disable auto-play and update UI
     */
    function disable() {
        State.isAutoPlayActive = false;
        UI.updateAutoPlayButton();
    }

    /**
     * Execute auto-play move
     * Main entry point for auto-play functionality
     */
    function execute() {
        if (!State.isAutoPlayActive) return;

        // Check if game is over
        if (Board.isGameOver()) {
            console.log('%cAuto-play: Game appears to be finished',
                        'color: #e74c3c; font-weight: bold');
            UI.updateStatus('Game over - Auto-play disabled');
            disable();
            return;
        }

        // Find move to execute
        const moveEntry = findMoveToExecute();
        if (!moveEntry || !moveEntry.move) {
            console.log('%cAuto-play: No valid move found',
                        'color: #e74c3c; font-weight: bold');
            return;
        }

        console.log('%cAuto-play: Attempting move ' + moveEntry.move,
                    'color: #2ecc71; font-weight: bold; font-size: 14px');

        try {
            executeMove(moveEntry.move);
        } catch (error) {
            console.error('Auto-play: Error during move execution:', error);
        }
    }

    // Public API
    return {
        execute,
        disable,
        handlePromotion
    };
})();

console.log('Chess Assistant: AutoPlay module loaded');
