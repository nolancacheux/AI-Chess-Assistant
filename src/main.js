/**
 * Chess Assistant - Main Entry Point
 * Orchestrates all modules and handles the main application flow
 * @module main
 */

(function() {
    'use strict';

    // Module references (set after all modules load)
    let Config, State, Board, Engine, UI, AutoPlay;

    /**
     * Initialize module references
     */
    function initModuleReferences() {
        Config = window.ChessAssistant.Config;
        State = window.ChessAssistant.State;
        Board = window.ChessAssistant.Board;
        Engine = window.ChessAssistant.Engine;
        UI = window.ChessAssistant.UI;
        AutoPlay = window.ChessAssistant.AutoPlay;
    }

    /**
     * Handle activate button click
     */
    function handleActivate() {
        console.log('Chess Assistant: Activating...');

        // Find chess board
        const board = Board.findChessBoard();
        if (!board) {
            alert('Could not find the chessboard. Make sure you are on a game page.');
            return;
        }

        State.chessBoardElement = board;
        UI.showColorSelection();
    }

    /**
     * Handle color selection
     * @param {string} color - 'w' or 'b'
     */
    function handleColorSelect(color) {
        UI.setInitializingState();
        State.playerColor = color;
        State.isActive = true;

        console.log(`Chess Assistant: Selected color ${color === 'w' ? 'White' : 'Black'}`);

        // Initialize with slight delay for UI update
        setTimeout(() => {
            const result = initializeAssistant(color);

            if (result.success) {
                UI.setActiveState();
                console.log(`%cChess Assistant: Activated as ${color === 'w' ? 'White' : 'Black'}`,
                            'color: #2ecc71; font-weight: bold');
            } else {
                alert(`Error: ${result.message}`);
                State.isActive = false;
                UI.setInactiveState();
            }
        }, Config.TIMING.INIT_DELAY);
    }

    /**
     * Handle deactivate button click
     */
    function handleDeactivate() {
        console.log('Chess Assistant: Deactivating...');
        stopAssistant();
        UI.setInactiveState();
    }

    /**
     * Handle auto-play toggle
     * @param {boolean} isActive - Whether auto-play is active
     */
    function handleAutoPlayToggle(isActive) {
        console.log(`Chess Assistant: Auto-play ${isActive ? 'enabled' : 'disabled'}`);

        if (isActive) {
            AutoPlay.execute();
        }
    }

    /**
     * Initialize the chess assistant
     * @param {string} turnMarker - 'w' or 'b'
     * @returns {Object} Result object with success status
     */
    function initializeAssistant(turnMarker) {
        const board = State.chessBoardElement;
        if (!board) {
            console.error('Chess Assistant: Chessboard reference not found');
            return { success: false, message: 'Internal Error: Chessboard reference not found' };
        }

        // Add visual styling to board
        Board.addBoardStyling();

        // Get initial FEN
        const initialFEN = Board.getFullFEN(turnMarker);
        console.log('Chess Assistant: Initial FEN:', initialFEN);

        // Initialize engine
        const engineResult = Engine.initialize();
        if (!engineResult.success) {
            return engineResult;
        }

        // Set up engine callbacks
        Engine.onBestMove(handleBestMove);
        Engine.onAnalysis(handleAnalysis);

        // Start initial analysis
        Engine.analyze(initialFEN, Config.ANALYSIS_DEPTH.TARGET);

        // Initialize board state tracking
        State.lastOpponentBoardState = Board.generateFENString();
        State.waitingForOpponentMove = false;
        State.lastOpponentMoveTimestamp = new Date();

        // Start board polling
        startBoardPolling(turnMarker);

        return { success: true };
    }

    /**
     * Start polling the board for changes
     * @param {string} turnMarker - Player's color marker
     */
    function startBoardPolling(turnMarker) {
        // Clear existing interval
        if (State.boardPollingInterval) {
            clearInterval(State.boardPollingInterval);
        }

        let currentFEN = Board.getFullFEN(turnMarker);

        State.boardPollingInterval = setInterval(() => {
            const boardFEN = Board.generateFENString();

            // Check if board changed
            if (boardFEN !== State.lastOpponentBoardState) {
                console.log('%cChess Assistant: Board change detected',
                            'color: #e74c3c; font-weight: bold');

                const newFEN = `${boardFEN} ${turnMarker}`;
                if (newFEN !== currentFEN) {
                    console.log('Chess Assistant: Turn change detected');
                    currentFEN = newFEN;

                    handleTurnChange(turnMarker, boardFEN, currentFEN);
                }
            }
        }, Config.TIMING.BOARD_POLLING);
    }

    /**
     * Handle turn change detection
     * @param {string} turnMarker - Player's color marker
     * @param {string} boardFEN - Current board FEN
     * @param {string} fullFEN - Full FEN with turn marker
     */
    function handleTurnChange(turnMarker, boardFEN, fullFEN) {
        const fenParts = fullFEN.split(' ');
        const currentTurn = fenParts[1];
        const isMyTurn = currentTurn === turnMarker;

        if (!isMyTurn) {
            // Opponent's turn
            State.lastOpponentBoardState = boardFEN;
            State.waitingForOpponentMove = true;
            UI.updateStatus("Opponent's turn - waiting...");
        } else if (isMyTurn && State.waitingForOpponentMove) {
            // My turn after opponent moved
            handleMyTurnAfterOpponent(fullFEN);
        } else {
            // My turn (initial or after my move)
            UI.updateStatus('Your turn - waiting for analysis...');
            Engine.analyze(fullFEN, Config.ANALYSIS_DEPTH.TARGET);
        }
    }

    /**
     * Handle my turn after opponent's move
     * @param {string} fullFEN - Full FEN position
     */
    function handleMyTurnAfterOpponent(fullFEN) {
        State.waitingForOpponentMove = false;
        State.lastOpponentMoveTimestamp = new Date();

        console.log('%cOpponent moved at: ' + State.lastOpponentMoveTimestamp.toLocaleTimeString(),
                    'color: #3498db; font-weight: bold');

        // Clear old analysis
        State.clearAnalysisHistory();

        // Request new analysis
        UI.updateStatus('Your turn - analyzing new position...');
        Engine.analyze(fullFEN, Config.ANALYSIS_DEPTH.TARGET);

        // Handle auto-play if enabled
        if (State.isAutoPlayActive) {
            handleAutoPlayAfterOpponent(fullFEN);
        }
    }

    /**
     * Handle auto-play after opponent's move
     * @param {string} fullFEN - Full FEN position
     */
    function handleAutoPlayAfterOpponent(fullFEN) {
        console.log(`%cAuto-play: Running quick depth ${Config.ANALYSIS_DEPTH.AUTO_PLAY} analysis`,
                    'color: #2ecc71; font-weight: bold');

        setTimeout(() => {
            if (!State.isAutoPlayActive) return;

            // Run quick analysis for auto-play
            Engine.stop();
            Engine.analyze(fullFEN, Config.ANALYSIS_DEPTH.AUTO_PLAY);

            // Execute after analysis completes
            setTimeout(() => {
                if (State.isAutoPlayActive) {
                    console.log('%cAuto-play: Timer triggered, checking for valid moves',
                                'color: #2ecc71');
                    AutoPlay.execute();
                }
            }, Config.TIMING.AUTO_PLAY_ANALYSIS_WAIT);
        }, Config.TIMING.AUTO_PLAY_DELAY);
    }

    /**
     * Handle best move from engine
     * @param {string} move - Best move notation
     */
    function handleBestMove(move) {
        UI.displaySuggestion(move);
        UI.updateStatus(`Suggested Move: ${move}`);
        UI.showAutoPlayButton();
    }

    /**
     * Handle analysis update from engine
     * @param {Object} data - Analysis data
     */
    function handleAnalysis(data) {
        UI.displaySuggestion(data.move);
        UI.updateStatus(`Depth: ${data.depth} | Score: ${data.score} | Move: ${data.move}`);
        UI.updateHistoryPanel();
        UI.updateAdvantageIndicator(data.score);
        UI.showAutoPlayButton();
    }

    /**
     * Stop the assistant and clean up
     */
    function stopAssistant() {
        // Clear polling
        if (State.boardPollingInterval) {
            clearInterval(State.boardPollingInterval);
            State.boardPollingInterval = null;
        }

        // Terminate engine
        Engine.terminate();

        // Clear highlights
        UI.clearHighlights();

        // Reset state
        State.isActive = false;
        State.isAutoPlayActive = false;

        console.log('Chess Assistant: Stopped');
    }

    /**
     * Initialize the application
     */
    function initialize() {
        console.log('Chess Assistant: Initializing...');

        // Init module references
        initModuleReferences();

        // Create UI panel
        UI.createPanel();

        // Set up UI callbacks
        UI.onActivate(handleActivate);
        UI.onDeactivate(handleDeactivate);
        UI.onColorSelect(handleColorSelect);
        UI.onAutoPlayToggle(handleAutoPlayToggle);

        // Subscribe to state changes
        State.subscribe('onAnalysisUpdate', () => {
            UI.updateHistoryPanel();
        });

        console.log('Chess Assistant: Ready');
    }

    // Entry point
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initialize();
    } else {
        document.addEventListener('DOMContentLoaded', initialize);
    }
})();
