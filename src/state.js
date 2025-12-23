/**
 * Chess Assistant - State Management Module
 * Centralized state management with getters/setters
 * @module state
 */

window.ChessAssistant = window.ChessAssistant || {};

/**
 * State manager singleton
 * Encapsulates all mutable state with controlled access
 */
window.ChessAssistant.State = (function() {
    // Private state
    const state = {
        isActive: false,
        isAutoPlayActive: false,
        playerColor: 'w',
        waitingForOpponentMove: false,
        lastOpponentMoveTimestamp: null,
        lastOpponentBoardState: null,
        lastBestMove: null,
        moveRepetitionCount: 0,
        analysisHistory: [],
        chessBoardElement: null,
        stockfishEngine: null,
        boardPollingInterval: null
    };

    // Event listeners for state changes
    const listeners = {
        onActiveChange: [],
        onAutoPlayChange: [],
        onAnalysisUpdate: []
    };

    /**
     * Notify listeners of a state change
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    function notifyListeners(event, data) {
        if (listeners[event]) {
            listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Chess Assistant: Error in ${event} listener:`, error);
                }
            });
        }
    }

    return {
        // Activation state
        get isActive() {
            return state.isActive;
        },
        set isActive(value) {
            const oldValue = state.isActive;
            state.isActive = Boolean(value);
            if (oldValue !== state.isActive) {
                notifyListeners('onActiveChange', state.isActive);
            }
        },

        // Auto-play state
        get isAutoPlayActive() {
            return state.isAutoPlayActive;
        },
        set isAutoPlayActive(value) {
            const oldValue = state.isAutoPlayActive;
            state.isAutoPlayActive = Boolean(value);
            if (oldValue !== state.isAutoPlayActive) {
                notifyListeners('onAutoPlayChange', state.isAutoPlayActive);
            }
        },

        // Player color
        get playerColor() {
            return state.playerColor;
        },
        set playerColor(value) {
            if (value === 'w' || value === 'b') {
                state.playerColor = value;
            } else {
                console.warn('Chess Assistant: Invalid player color:', value);
            }
        },

        // Opponent move tracking
        get waitingForOpponentMove() {
            return state.waitingForOpponentMove;
        },
        set waitingForOpponentMove(value) {
            state.waitingForOpponentMove = Boolean(value);
        },

        get lastOpponentMoveTimestamp() {
            return state.lastOpponentMoveTimestamp;
        },
        set lastOpponentMoveTimestamp(value) {
            state.lastOpponentMoveTimestamp = value;
        },

        get lastOpponentBoardState() {
            return state.lastOpponentBoardState;
        },
        set lastOpponentBoardState(value) {
            state.lastOpponentBoardState = value;
        },

        // Move tracking
        get lastBestMove() {
            return state.lastBestMove;
        },
        set lastBestMove(value) {
            state.lastBestMove = value;
        },

        get moveRepetitionCount() {
            return state.moveRepetitionCount;
        },
        set moveRepetitionCount(value) {
            state.moveRepetitionCount = Number(value) || 0;
        },

        // Analysis history
        get analysisHistory() {
            return state.analysisHistory;
        },

        /**
         * Add entry to analysis history
         * @param {Object} entry - Analysis entry
         */
        addAnalysisEntry(entry) {
            const Config = window.ChessAssistant.Config;
            state.analysisHistory.unshift(entry);

            // Limit history size
            if (state.analysisHistory.length > Config.HISTORY.MAX_ENTRIES) {
                state.analysisHistory.pop();
            }

            notifyListeners('onAnalysisUpdate', state.analysisHistory);
        },

        /**
         * Clear analysis history
         */
        clearAnalysisHistory() {
            state.analysisHistory = [];
            notifyListeners('onAnalysisUpdate', state.analysisHistory);
        },

        // DOM references
        get chessBoardElement() {
            return state.chessBoardElement;
        },
        set chessBoardElement(value) {
            state.chessBoardElement = value;
        },

        // Engine reference
        get stockfishEngine() {
            return state.stockfishEngine;
        },
        set stockfishEngine(value) {
            state.stockfishEngine = value;
        },

        // Polling interval
        get boardPollingInterval() {
            return state.boardPollingInterval;
        },
        set boardPollingInterval(value) {
            state.boardPollingInterval = value;
        },

        /**
         * Subscribe to state changes
         * @param {string} event - Event name
         * @param {Function} callback - Callback function
         * @returns {Function} Unsubscribe function
         */
        subscribe(event, callback) {
            if (listeners[event] && typeof callback === 'function') {
                listeners[event].push(callback);
                return () => {
                    const index = listeners[event].indexOf(callback);
                    if (index > -1) {
                        listeners[event].splice(index, 1);
                    }
                };
            }
            return () => {};
        },

        /**
         * Reset all state to defaults
         */
        reset() {
            state.isActive = false;
            state.isAutoPlayActive = false;
            state.playerColor = 'w';
            state.waitingForOpponentMove = false;
            state.lastOpponentMoveTimestamp = null;
            state.lastOpponentBoardState = null;
            state.lastBestMove = null;
            state.moveRepetitionCount = 0;
            state.analysisHistory = [];
            state.chessBoardElement = null;
            state.stockfishEngine = null;
            state.boardPollingInterval = null;
        },

        /**
         * Get current state snapshot (for debugging)
         * @returns {Object} State snapshot
         */
        getSnapshot() {
            return { ...state, analysisHistory: [...state.analysisHistory] };
        }
    };
})();

console.log('Chess Assistant: State module loaded');
