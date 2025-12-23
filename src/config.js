/**
 * Chess Assistant - Configuration Module
 * Contains all constants, selectors, and configuration values
 * @module config
 */

// Use namespace to avoid global pollution
window.ChessAssistant = window.ChessAssistant || {};

window.ChessAssistant.Config = {
    // Analysis depth settings
    ANALYSIS_DEPTH: {
        TARGET: 15,
        AUTO_PLAY: 2,
        MIN: 1,
        MAX: 26
    },

    // Timing intervals (in milliseconds)
    TIMING: {
        BOARD_POLLING: 500,
        AUTO_PLAY_DELAY: 100,
        AUTO_PLAY_ANALYSIS_WAIT: 500,
        MOVE_SEQUENCE_DELAY: 150,
        POST_MOVE_DELAY: 800,
        PROMOTION_DELAY: 500,
        INIT_DELAY: 50
    },

    // History limits
    HISTORY: {
        MAX_ENTRIES: 100
    },

    // Score thresholds for move ratings
    SCORE_THRESHOLDS: {
        WINNING: 2000,
        DECISIVE: 1000,
        CLEAR: 500,
        SIGNIFICANT: 300,
        SLIGHT: 200
    },

    // Advantage indicator settings
    ADVANTAGE: {
        MAX_SCORE: 2000
    },

    // DOM Selectors
    SELECTORS: {
        CHESS_BOARD: 'wc-chess-board',
        BOARD_LAYOUT: '.board-layout-chessboard',
        PIECE: '.piece',
        SUGGESTION_HIGHLIGHT: '.suggestion-highlight',
        GAME_END_MARKERS: '.notation-result-component',
        RESULT_TEXT: '.vertical-result-component',
        PROMOTION_BOX: '.promotion-piece-selector',
        PROMOTION_PIECE: '.promotion-piece',
        SVG_COORDINATES: 'svg.coordinates'
    },

    // Panel element IDs
    PANEL_IDS: {
        MAIN: 'chess-assistant-panel',
        CONTENT: 'assistant-content',
        STATUS: 'assistant-status',
        HISTORY: 'analysis-history',
        CONTROL_BUTTON: 'assistant-control-button',
        COLLAPSE_BUTTON: 'collapse-button',
        COLOR_CONTAINER: 'color-choice-container',
        CHANGE_COLOR_BUTTON: 'change-color-button',
        AUTO_PLAY_BUTTON: 'auto-play-button',
        ADVANTAGE_INDICATOR: 'advantage-indicator',
        ADVANTAGE_BAR: 'advantage-bar',
        ADVANTAGE_MARKER: 'advantage-marker'
    },

    // Stockfish worker path (chess.com specific)
    STOCKFISH_PATH: '/bundles/app/js/vendor/jschessengine/stockfish.asm.1abfa10c.js',

    // Player colors
    COLORS: {
        WHITE: 'w',
        BLACK: 'b'
    },

    // Board configuration
    BOARD: {
        FILES: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
        RANKS: [1, 2, 3, 4, 5, 6, 7, 8],
        SIZE: 8
    },

    // File to coordinate mapping
    FILE_MAP: { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 },

    // Rank to row mapping (for white perspective)
    RANK_MAP: { 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 0 },

    // Piece symbol regex pattern
    PIECE_PATTERN: /^[wb][prnbqk]$/,

    // Move notation regex pattern
    MOVE_PATTERN: /[a-h][1-8][a-h][1-8](?:[qrbn])?/
};

// Freeze configuration to prevent accidental modifications
Object.freeze(window.ChessAssistant.Config);
Object.freeze(window.ChessAssistant.Config.ANALYSIS_DEPTH);
Object.freeze(window.ChessAssistant.Config.TIMING);
Object.freeze(window.ChessAssistant.Config.HISTORY);
Object.freeze(window.ChessAssistant.Config.SCORE_THRESHOLDS);
Object.freeze(window.ChessAssistant.Config.ADVANTAGE);
Object.freeze(window.ChessAssistant.Config.SELECTORS);
Object.freeze(window.ChessAssistant.Config.PANEL_IDS);
Object.freeze(window.ChessAssistant.Config.COLORS);
Object.freeze(window.ChessAssistant.Config.BOARD);
Object.freeze(window.ChessAssistant.Config.FILE_MAP);
Object.freeze(window.ChessAssistant.Config.RANK_MAP);

console.log('Chess Assistant: Config module loaded');
