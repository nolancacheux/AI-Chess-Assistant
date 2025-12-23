/**
 * Chess Assistant - UI Module
 * Handles all user interface components and interactions
 * @module ui
 */

window.ChessAssistant = window.ChessAssistant || {};

window.ChessAssistant.UI = (function() {
    const Config = window.ChessAssistant.Config;
    const State = window.ChessAssistant.State;
    const Engine = window.ChessAssistant.Engine;
    const IDs = Config.PANEL_IDS;

    // Track if pulse animation style has been added
    let pulseStyleAdded = false;

    // Callbacks for UI events
    let onColorSelectCallback = null;
    let onActivateCallback = null;
    let onDeactivateCallback = null;
    let onAutoPlayToggleCallback = null;

    // --- Styles ---

    const STYLES = {
        panel: `
            position: fixed;
            right: 20px;
            top: 20px;
            width: 400px;
            background: #f8f9fa;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            z-index: 1000;
            transition: all 0.3s ease;
        `,
        header: `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e9ecef;
            position: relative;
        `,
        title: `
            margin: 0;
            color: #2c3e50;
            font-size: 1.4em;
        `,
        button: `
            background: #2c3e50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1.1em;
            transition: background 0.2s;
        `,
        collapseButton: `
            background: #2c3e50;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.5em;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            position: absolute;
            left: 50%;
            top: 15px;
            transform: translateX(-50%);
            z-index: 2;
        `,
        colorContainer: `
            display: none;
            gap: 15px;
            margin: 20px 0;
            justify-content: center;
        `,
        status: `
            margin: 15px 0;
            padding: 15px;
            background: #ecf0f1;
            border-radius: 4px;
            font-size: 1.1em;
            color: #2c3e50;
        `,
        history: `
            max-height: 300px;
            overflow-y: auto;
            margin-top: 20px;
            padding: 15px;
            background: #ecf0f1;
            border-radius: 4px;
            font-size: 1.1em;
        `,
        advantageIndicator: `
            height: 20px;
            background: #2c3e50;
            border: 2px solid #ffffff;
            border-radius: 10px;
            margin: 15px 0;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 0 2px #2c3e50;
        `,
        advantageBar: `
            position: absolute;
            height: 100%;
            width: 50%;
            background: #ffffff;
            left: 0;
            transition: width 0.3s ease, left 0.3s ease;
            border-radius: 8px;
        `,
        advantageMarker: `
            position: absolute;
            width: 4px;
            height: 100%;
            background: #e74c3c;
            left: 50%;
            transform: translateX(-50%);
            transition: left 0.3s ease;
        `,
        highlight: `
            border: 4px solid #e74c3c;
            box-sizing: border-box;
            pointer-events: none;
            border-radius: 4px;
            box-shadow: 0 0 20px rgba(231, 76, 60, 0.8);
            background: transparent;
            position: absolute;
            z-index: 1000;
            animation: pulse 2s infinite;
        `
    };

    // --- Panel Creation ---

    /**
     * Create the main assistant panel
     */
    function createPanel() {
        if (document.getElementById(IDs.MAIN)) return;

        const panel = createElement('div', { id: IDs.MAIN }, STYLES.panel);
        const header = createHeader();
        const content = createContent();

        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);

        console.log('Chess Assistant: UI panel created');
    }

    /**
     * Create header section
     * @returns {Element} Header element
     */
    function createHeader() {
        const header = createElement('div', {}, STYLES.header);

        const title = createElement('h3', {}, STYLES.title);
        title.textContent = 'Chess Assistant';

        const controlButton = createButton(IDs.CONTROL_BUTTON, 'Activate', STYLES.button);
        controlButton.onclick = () => {
            if (onActivateCallback) onActivateCallback();
        };

        const collapseButton = createButton(IDs.COLLAPSE_BUTTON, '−', STYLES.collapseButton);
        let isCollapsed = false;
        collapseButton.onclick = () => {
            isCollapsed = !isCollapsed;
            collapseButton.textContent = isCollapsed ? '+' : '−';

            const content = document.getElementById(IDs.CONTENT);
            const panel = document.getElementById(IDs.MAIN);
            if (content && panel) {
                content.style.display = isCollapsed ? 'none' : 'block';
                panel.style.height = isCollapsed ? '100px' : 'auto';
            }
        };

        header.appendChild(title);
        header.appendChild(controlButton);
        header.appendChild(collapseButton);

        return header;
    }

    /**
     * Create content section
     * @returns {Element} Content element
     */
    function createContent() {
        const content = createElement('div', { id: IDs.CONTENT }, 'transition: all 0.3s ease;');

        // Advantage indicator
        const advantageIndicator = createAdvantageIndicator();
        content.appendChild(advantageIndicator);

        // Color selection
        const colorContainer = createColorSelection();
        content.appendChild(colorContainer);

        // Status display
        const status = createElement('div', { id: IDs.STATUS }, STYLES.status);
        content.appendChild(status);

        // History panel
        const history = createElement('div', { id: IDs.HISTORY }, STYLES.history);
        content.appendChild(history);

        // Change color button
        const changeColorButton = createButton(IDs.CHANGE_COLOR_BUTTON, 'Change Color',
            STYLES.button + 'background: #3498db; display: none; margin-top: 15px;');
        changeColorButton.onmouseover = () => changeColorButton.style.background = '#2980b9';
        changeColorButton.onmouseout = () => changeColorButton.style.background = '#3498db';
        changeColorButton.onclick = () => {
            if (onDeactivateCallback) onDeactivateCallback();
            if (onActivateCallback) onActivateCallback();
        };
        content.appendChild(changeColorButton);

        // Auto play button
        const autoPlayButton = createButton(IDs.AUTO_PLAY_BUTTON, 'Auto Play',
            STYLES.button + 'display: none; margin-top: 15px;');
        autoPlayButton.onclick = () => {
            State.isAutoPlayActive = !State.isAutoPlayActive;
            updateAutoPlayButton();
            if (onAutoPlayToggleCallback) onAutoPlayToggleCallback(State.isAutoPlayActive);
        };
        content.appendChild(autoPlayButton);

        return content;
    }

    /**
     * Create advantage indicator
     * @returns {Element} Advantage indicator element
     */
    function createAdvantageIndicator() {
        const indicator = createElement('div', { id: IDs.ADVANTAGE_INDICATOR }, STYLES.advantageIndicator);
        const bar = createElement('div', { id: IDs.ADVANTAGE_BAR }, STYLES.advantageBar);
        const marker = createElement('div', { id: IDs.ADVANTAGE_MARKER }, STYLES.advantageMarker);

        indicator.appendChild(bar);
        indicator.appendChild(marker);

        return indicator;
    }

    /**
     * Create color selection buttons
     * @returns {Element} Color container element
     */
    function createColorSelection() {
        const container = createElement('div', { id: IDs.COLOR_CONTAINER }, STYLES.colorContainer);

        const whiteButton = createColorButton('&#9812;', 'w');
        const blackButton = createColorButton('&#9818;', 'b');

        container.appendChild(whiteButton);
        container.appendChild(blackButton);

        return container;
    }

    /**
     * Create a color selection button
     * @param {string} symbol - Unicode chess piece symbol
     * @param {string} color - 'w' or 'b'
     * @returns {Element} Button element
     */
    function createColorButton(symbol, color) {
        const button = document.createElement('button');
        button.innerHTML = symbol;
        button.style.cssText = `
            background: ${color === 'w' ? '#ecf0f1' : '#2c3e50'};
            color: ${color === 'w' ? '#2c3e50' : 'white'};
            border: 2px solid ${color === 'w' ? '#bdc3c7' : '#34495e'};
            padding: 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 2em;
            width: 70px;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
        button.onmouseover = () => button.style.transform = 'scale(1.05)';
        button.onmouseout = () => button.style.transform = 'scale(1)';
        button.onclick = () => {
            if (onColorSelectCallback) onColorSelectCallback(color);
        };

        return button;
    }

    // --- Element Helpers ---

    /**
     * Create a DOM element with attributes and styles
     * @param {string} tag - Tag name
     * @param {Object} attrs - Attributes
     * @param {string} styles - CSS styles
     * @returns {Element} Created element
     */
    function createElement(tag, attrs = {}, styles = '') {
        const element = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            element[key] = value;
        });
        if (styles) {
            element.style.cssText = styles;
        }
        return element;
    }

    /**
     * Create a button element
     * @param {string} id - Button ID
     * @param {string} text - Button text
     * @param {string} styles - CSS styles
     * @returns {Element} Button element
     */
    function createButton(id, text, styles) {
        const button = createElement('button', { id }, styles);
        button.textContent = text;

        // Add hover effects
        button.onmouseover = () => {
            if (!button.disabled) {
                button.style.background = '#34495e';
            }
        };
        button.onmouseout = () => {
            if (!button.disabled && !State.isAutoPlayActive) {
                button.style.background = '#2c3e50';
            }
        };

        return button;
    }

    // --- Update Functions ---

    /**
     * Update status text
     * @param {string} text - Status text
     */
    function updateStatus(text) {
        const statusElement = document.getElementById(IDs.STATUS);
        if (statusElement) {
            statusElement.textContent = text;
            if (State.isAutoPlayActive) {
                statusElement.textContent += ' (Auto-play active)';
            }
        }
    }

    /**
     * Update history panel with analysis entries
     */
    function updateHistoryPanel() {
        const historyPanel = document.getElementById(IDs.HISTORY);
        if (!historyPanel) return;

        const history = State.analysisHistory;
        const sortedHistory = [...history].sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        historyPanel.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #2c3e50; color: white;">
                        <th style="padding: 8px; text-align: left;">Time</th>
                        <th style="padding: 8px; text-align: left;">Move</th>
                        <th style="padding: 8px; text-align: left;">Score</th>
                        <th style="padding: 8px; text-align: left;">Rating</th>
                        <th style="padding: 8px; text-align: left;">Depth</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedHistory.map((entry, index) => `
                        <tr class="history-entry ${entry.isFinal ? 'final-move' : ''}"
                            style="border-bottom: 1px solid #e9ecef; opacity: ${index === 0 ? 1 : 0.6};">
                            <td style="padding: 8px;">${new Date(entry.timestamp).toLocaleTimeString()}</td>
                            <td style="padding: 8px;">${entry.move || '-'}</td>
                            <td style="padding: 8px;">${entry.score ?? '-'}</td>
                            <td style="padding: 8px;">${Engine.getMoveRating(entry.score)}</td>
                            <td style="padding: 8px;">${entry.depth || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Update advantage indicator bar
     * @param {number|null} score - Centipawn score
     */
    function updateAdvantageIndicator(score) {
        const bar = document.getElementById(IDs.ADVANTAGE_BAR);
        const marker = document.getElementById(IDs.ADVANTAGE_MARKER);
        if (!bar || !marker) return;

        const maxScore = Config.ADVANTAGE.MAX_SCORE;
        let percentage = 50;

        if (score !== null && score !== undefined) {
            percentage = 50 + (score / maxScore) * 50;
            percentage = Math.max(0, Math.min(100, percentage));
        }

        if (percentage > 50) {
            bar.style.width = `${percentage}%`;
            bar.style.left = '0';
        } else {
            bar.style.width = `${100 - percentage}%`;
            bar.style.left = `${percentage}%`;
        }
        bar.style.background = '#ffffff';
        marker.style.left = `${percentage}%`;
    }

    /**
     * Update auto play button state
     */
    function updateAutoPlayButton() {
        const button = document.getElementById(IDs.AUTO_PLAY_BUTTON);
        if (!button) return;

        if (State.isAutoPlayActive) {
            button.style.background = '#2ecc71';
            button.textContent = 'Stop Auto Play';
        } else {
            button.style.background = '#2c3e50';
            button.textContent = 'Auto Play';
        }
    }

    /**
     * Show auto play button
     */
    function showAutoPlayButton() {
        const button = document.getElementById(IDs.AUTO_PLAY_BUTTON);
        if (button) {
            button.style.display = 'block';
        }
    }

    /**
     * Hide auto play button
     */
    function hideAutoPlayButton() {
        const button = document.getElementById(IDs.AUTO_PLAY_BUTTON);
        if (button) {
            button.style.display = 'none';
        }
    }

    // --- Color Selection Flow ---

    /**
     * Show color selection UI
     */
    function showColorSelection() {
        const container = document.getElementById(IDs.COLOR_CONTAINER);
        const controlButton = document.getElementById(IDs.CONTROL_BUTTON);

        if (container) {
            container.style.display = 'flex';
        }
        if (controlButton) {
            controlButton.textContent = 'Choose your color';
            controlButton.disabled = true;
        }
    }

    /**
     * Hide color selection UI
     */
    function hideColorSelection() {
        const container = document.getElementById(IDs.COLOR_CONTAINER);
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Update UI for active state
     */
    function setActiveState() {
        const controlButton = document.getElementById(IDs.CONTROL_BUTTON);
        const changeColorButton = document.getElementById(IDs.CHANGE_COLOR_BUTTON);

        if (controlButton) {
            controlButton.disabled = false;
            controlButton.textContent = 'Deactivate';
            controlButton.onclick = () => {
                if (onDeactivateCallback) onDeactivateCallback();
            };
        }
        if (changeColorButton) {
            changeColorButton.style.display = 'block';
        }
    }

    /**
     * Update UI for inactive state
     */
    function setInactiveState() {
        const controlButton = document.getElementById(IDs.CONTROL_BUTTON);
        const changeColorButton = document.getElementById(IDs.CHANGE_COLOR_BUTTON);

        if (controlButton) {
            controlButton.disabled = false;
            controlButton.textContent = 'Activate';
            controlButton.onclick = () => {
                if (onActivateCallback) onActivateCallback();
            };
        }
        if (changeColorButton) {
            changeColorButton.style.display = 'none';
        }

        hideColorSelection();
        hideAutoPlayButton();
    }

    /**
     * Update UI for initializing state
     */
    function setInitializingState() {
        const controlButton = document.getElementById(IDs.CONTROL_BUTTON);
        if (controlButton) {
            controlButton.textContent = 'Initializing...';
            controlButton.disabled = true;
        }
        hideColorSelection();
    }

    // --- Highlighting ---

    /**
     * Add pulse animation style (once)
     */
    function addPulseAnimationStyle() {
        if (pulseStyleAdded) return;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { box-shadow: 0 0 20px rgba(231, 76, 60, 0.8); }
                50% { box-shadow: 0 0 30px rgba(231, 76, 60, 0.6); }
                100% { box-shadow: 0 0 20px rgba(231, 76, 60, 0.8); }
            }
        `;
        document.head.appendChild(style);
        pulseStyleAdded = true;
    }

    /**
     * Display move suggestion highlight on board
     * @param {string} move - Move notation (e.g., 'e2e4')
     */
    function displaySuggestion(move) {
        const board = State.chessBoardElement;
        if (!board) return;

        // Clear existing highlights
        clearHighlights();

        // Don't show highlights when waiting for opponent
        if (State.waitingForOpponentMove) return;

        // Add pulse animation style if needed
        addPulseAnimationStyle();

        // Dim all pieces
        const allPieces = board.querySelectorAll('.piece');
        allPieces.forEach(piece => {
            piece.style.opacity = '0.8';
        });

        // Parse move
        const fileToCoord = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };
        const startSquare = `${fileToCoord[move[0]]}${move[1]}`;
        const endSquare = `${fileToCoord[move[2]]}${move[3]}`;

        // Reset opacity for highlighted pieces
        const startPiece = board.querySelector(`.piece.square-${startSquare}`);
        const endPiece = board.querySelector(`.piece.square-${endSquare}`);
        if (startPiece) startPiece.style.opacity = '1';
        if (endPiece) endPiece.style.opacity = '1';

        // Add highlights
        [startSquare, endSquare].forEach(squareCoord => {
            const highlight = document.createElement('div');
            highlight.className = `highlight suggestion-highlight square-${squareCoord}`;
            highlight.style.cssText = STYLES.highlight;
            board.appendChild(highlight);
        });
    }

    /**
     * Clear all move suggestion highlights
     */
    function clearHighlights() {
        const board = State.chessBoardElement;
        if (!board) return;

        board.querySelectorAll('.suggestion-highlight').forEach(el => el.remove());

        // Reset piece opacity
        const allPieces = board.querySelectorAll('.piece');
        allPieces.forEach(piece => {
            piece.style.opacity = '1';
        });
    }

    // --- Event Callbacks ---

    /**
     * Set callback for color selection
     * @param {Function} callback - Callback function
     */
    function onColorSelect(callback) {
        onColorSelectCallback = callback;
    }

    /**
     * Set callback for activate button
     * @param {Function} callback - Callback function
     */
    function onActivate(callback) {
        onActivateCallback = callback;
    }

    /**
     * Set callback for deactivate button
     * @param {Function} callback - Callback function
     */
    function onDeactivate(callback) {
        onDeactivateCallback = callback;
    }

    /**
     * Set callback for auto play toggle
     * @param {Function} callback - Callback function
     */
    function onAutoPlayToggle(callback) {
        onAutoPlayToggleCallback = callback;
    }

    // Public API
    return {
        createPanel,
        updateStatus,
        updateHistoryPanel,
        updateAdvantageIndicator,
        updateAutoPlayButton,
        showAutoPlayButton,
        hideAutoPlayButton,
        showColorSelection,
        hideColorSelection,
        setActiveState,
        setInactiveState,
        setInitializingState,
        displaySuggestion,
        clearHighlights,
        onColorSelect,
        onActivate,
        onDeactivate,
        onAutoPlayToggle
    };
})();

console.log('Chess Assistant: UI module loaded');
