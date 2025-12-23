/**
 * Chess Assistant - Engine Module
 * Handles Stockfish engine initialization, communication, and analysis
 * @module engine
 */

window.ChessAssistant = window.ChessAssistant || {};

window.ChessAssistant.Engine = (function() {
    const Config = window.ChessAssistant.Config;
    const State = window.ChessAssistant.State;

    // Callbacks for engine events
    let onBestMoveCallback = null;
    let onAnalysisCallback = null;

    /**
     * Initialize the Stockfish engine
     * @returns {Object} Result object with success status and message
     */
    function initialize() {
        try {
            const engine = new Worker(Config.STOCKFISH_PATH);
            State.stockfishEngine = engine;

            // Set up message handler
            engine.onmessage = handleEngineMessage;

            console.log('Chess Assistant: Stockfish engine initialized');
            return { success: true };
        } catch (error) {
            console.error('Chess Assistant: Error loading Stockfish:', error);
            return {
                success: false,
                message: 'Could not load Stockfish engine'
            };
        }
    }

    /**
     * Handle messages from the Stockfish engine
     * @param {MessageEvent} event - Engine message event
     */
    function handleEngineMessage(event) {
        const message = event.data;

        if (typeof message !== 'string') return;

        if (message.startsWith('bestmove')) {
            handleBestMove(message);
        } else if (message.startsWith('info')) {
            handleInfoMessage(message);
        }
    }

    /**
     * Handle bestmove message from engine
     * @param {string} message - Bestmove message
     */
    function handleBestMove(message) {
        const move = message.split(' ')[1];
        if (!move) return;

        // Add to history as final move
        addAnalysisEntry(move, null, null, true);

        // Notify callback
        if (onBestMoveCallback) {
            onBestMoveCallback(move);
        }
    }

    /**
     * Handle info message from engine
     * @param {string} message - Info message
     */
    function handleInfoMessage(message) {
        const scoreMatch = message.match(/score cp (-?\d+)/);
        const depthMatch = message.match(/depth (\d+)/);
        const pvMatch = message.match(/ pv ([a-h][1-8][a-h][1-8](?:[qrbn])?)/);

        if (scoreMatch && depthMatch && pvMatch) {
            const score = parseInt(scoreMatch[1]);
            const depth = parseInt(depthMatch[1]);
            const move = pvMatch[1];

            // Add to history
            addAnalysisEntry(move, score, depth, false);

            // Notify callback
            if (onAnalysisCallback) {
                onAnalysisCallback({ move, score, depth });
            }
        }
    }

    /**
     * Add entry to analysis history with validation
     * @param {string} move - Move notation
     * @param {number|null} score - Centipawn score
     * @param {number|null} depth - Search depth
     * @param {boolean} isFinal - Whether this is a final bestmove
     */
    function addAnalysisEntry(move, score, depth, isFinal) {
        // Don't add entries with null/undefined values (except for final moves)
        if (!move) return;
        if (!isFinal && (score === null || score === undefined || !depth)) return;

        // Validate depth range
        const depthConfig = Config.ANALYSIS_DEPTH;
        if (depth && (depth < depthConfig.MIN || depth > depthConfig.MAX)) return;

        // Check for duplicate entry
        const history = State.analysisHistory;
        const lastEntry = history[0];
        if (lastEntry && lastEntry.depth === depth && lastEntry.move === move) return;

        // Handle move repetition
        handleMoveRepetition(move, depth);

        // Create and add entry
        const entry = {
            move,
            score,
            depth,
            isFinal,
            timestamp: new Date().toISOString()
        };

        State.addAnalysisEntry(entry);
    }

    /**
     * Handle move repetition detection
     * @param {string} move - Current move
     * @param {number} depth - Current depth
     */
    function handleMoveRepetition(move, depth) {
        if (move === State.lastBestMove) {
            State.moveRepetitionCount++;

            // Stop searching if same move suggested 3+ times at high depth
            if (State.moveRepetitionCount >= 3 && depth >= 20) {
                stop();
            }
        } else {
            State.lastBestMove = move;
            State.moveRepetitionCount = 1;
        }
    }

    /**
     * Send position to engine and start analysis
     * @param {string} fen - FEN position string
     * @param {number} [depth] - Analysis depth (defaults to target depth)
     */
    function analyze(fen, depth = Config.ANALYSIS_DEPTH.TARGET) {
        const engine = State.stockfishEngine;
        if (!engine) {
            console.error('Chess Assistant: Engine not initialized');
            return;
        }

        engine.postMessage(`position fen ${fen}`);
        engine.postMessage(`go depth ${depth}`);
    }

    /**
     * Stop current analysis
     */
    function stop() {
        const engine = State.stockfishEngine;
        if (engine) {
            engine.postMessage('stop');
        }
    }

    /**
     * Terminate the engine
     */
    function terminate() {
        const engine = State.stockfishEngine;
        if (engine) {
            engine.terminate();
            State.stockfishEngine = null;
            console.log('Chess Assistant: Engine terminated');
        }
    }

    /**
     * Set callback for bestmove events
     * @param {Function} callback - Callback function
     */
    function onBestMove(callback) {
        onBestMoveCallback = callback;
    }

    /**
     * Set callback for analysis events
     * @param {Function} callback - Callback function
     */
    function onAnalysis(callback) {
        onAnalysisCallback = callback;
    }

    /**
     * Convert centipawn score to human-readable rating
     * @param {number|null} score - Centipawn score
     * @returns {string} Human-readable rating
     */
    function getMoveRating(score) {
        if (score === null || score === undefined || score === '-') return '-';

        const thresholds = Config.SCORE_THRESHOLDS;

        if (score > thresholds.WINNING) return 'Winning';
        if (score < -thresholds.WINNING) return 'Losing';

        if (score > thresholds.DECISIVE) return 'Decisive Advantage';
        if (score < -thresholds.DECISIVE) return 'Decisive Disadvantage';

        if (score > thresholds.CLEAR) return 'Clear Advantage';
        if (score < -thresholds.CLEAR) return 'Clear Disadvantage';

        if (score > thresholds.SIGNIFICANT) return 'Significant Advantage';
        if (score < -thresholds.SIGNIFICANT) return 'Significant Disadvantage';

        if (score > thresholds.SLIGHT) return 'Slight Advantage';
        if (score < -thresholds.SLIGHT) return 'Slight Disadvantage';

        return 'Equal';
    }

    /**
     * Get the best available move from analysis history
     * @param {boolean} [requireRecentMove=true] - Only consider moves after opponent's last move
     * @returns {Object|null} Best move entry or null
     */
    function getBestMove(requireRecentMove = true) {
        const history = State.analysisHistory;

        if (requireRecentMove && State.lastOpponentMoveTimestamp) {
            // Filter for moves calculated after opponent's last move
            const validMoves = history.filter(entry => {
                const moveTime = new Date(entry.timestamp);
                return moveTime > State.lastOpponentMoveTimestamp &&
                       entry.depth === Config.ANALYSIS_DEPTH.AUTO_PLAY;
            });

            if (validMoves.length > 0) {
                return validMoves[0];
            }

            // Fallback: any move after opponent's move
            const anyValidMoves = history.filter(entry => {
                const moveTime = new Date(entry.timestamp);
                return moveTime > State.lastOpponentMoveTimestamp;
            });

            if (anyValidMoves.length > 0) {
                // Sort by isFinal first, then by depth
                anyValidMoves.sort((a, b) => {
                    if (a.isFinal && !b.isFinal) return -1;
                    if (!a.isFinal && b.isFinal) return 1;
                    return b.depth - a.depth;
                });
                return anyValidMoves[0];
            }
        }

        // Last resort: use most recent move
        return history.length > 0 ? history[0] : null;
    }

    // Public API
    return {
        initialize,
        analyze,
        stop,
        terminate,
        onBestMove,
        onAnalysis,
        getMoveRating,
        getBestMove
    };
})();

console.log('Chess Assistant: Engine module loaded');
