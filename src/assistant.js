// Chess Assistant
console.log("Chess Assistant: Initializing...");

let assistantIsActive = false;
let boardPollingInterval = null;
let stockfishEngine = null;
let chessBoardElement = null;
let analysisHistory = []; // Store analysis history
let lastBestMove = null;
let moveRepetitionCount = 0;
let isAutoPlayActive = false;
let lastOpponentBoardState = null; // Track opponent's last board state
let waitingForOpponentMove = false; // Flag to indicate we're waiting for opponent to move
let targetAnalysisDepth = 15; // Set fixed analysis depth to 15
let autoPlayAnalysisDepth = 2; // for auto-play for stronger moves
let lastOpponentMoveTimestamp = null; // Timestamp of the opponent's last move
let playerColor = 'w'; // Track if we're playing as white or black

// --- Core Functions ---

// Make generateFENString globally available
function generateFENString() {
    if (!chessBoardElement) return "";
    
    let fen = "";
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    const files = [1, 2, 3, 4, 5, 6, 7, 8];

    for (const rank of ranks) {
        let emptySquareCount = 0;
        for (const file of files) {
            const squareSelector = `.piece.square-${file}${rank}`;
            const pieceElement = chessBoardElement.querySelector(squareSelector);

            if (pieceElement) {
                if (emptySquareCount > 0) { fen += emptySquareCount; emptySquareCount = 0; }
                let pieceSymbol = null;
                for (const cssClass of pieceElement.classList) {
                    if (cssClass.length === 2 && /^[wb][prnbqk]$/.test(cssClass)) {
                        pieceSymbol = cssClass; break;
                    }
                }
                if (pieceSymbol) {
                    fen += (pieceSymbol[0] === 'w') ? pieceSymbol[1].toUpperCase() : pieceSymbol[1].toLowerCase();
                }
            } else {
                emptySquareCount++;
            }
        }
        if (emptySquareCount > 0) { fen += emptySquareCount; }
        if (rank > 1) { fen += "/"; }
    }
    return fen;
}

function initializeChessAssistant(fenTurnMarker) {
    console.log(`Chess Assistant: Initializing for ${fenTurnMarker === 'w' ? 'White' : 'Black'}`);

    if (!chessBoardElement) {
        console.error("Chess Assistant: Chessboard reference not found");
        return { success: false, message: "Internal Error: Chessboard reference not found" };
    }

    // Add border to initial position
    const initialPosition = document.querySelector('.board-layout-chessboard');
    if (initialPosition) {
        initialPosition.style.border = '2px solid #2c3e50';
        initialPosition.style.borderRadius = '4px';
    }

    let currentFEN = `${generateFENString()} ${fenTurnMarker}`;
    console.log("Chess Assistant: Initial FEN:", currentFEN);

    const stockfishWorkerPath = "/bundles/app/js/vendor/jschessengine/stockfish.asm.1abfa10c.js";

    try {
        stockfishEngine = new Worker(stockfishWorkerPath);
    } catch (e) {
        console.error("Chess Assistant: Error loading Stockfish:", e);
        return { success: false, message: "Could not load Stockfish engine" };
    }

    stockfishEngine.postMessage(`position fen ${currentFEN}`);
    stockfishEngine.postMessage(`go depth ${targetAnalysisDepth}`);

    if (boardPollingInterval) clearInterval(boardPollingInterval);
    
    // Set initial opponent board state
    lastOpponentBoardState = generateFENString();
    waitingForOpponentMove = false;
    lastOpponentMoveTimestamp = new Date();
    
    // Adjusted board polling interval to detect player's turn
    boardPollingInterval = setInterval(() => {
        const boardFEN = generateFENString();
        // Only proceed if the board has actually changed
        if (boardFEN !== lastOpponentBoardState) {
            console.log("%cChess Assistant: Board change detected", "color: #e74c3c; font-weight: bold");
            
            const newFEN = `${boardFEN} ${fenTurnMarker}`;
            if (newFEN !== currentFEN) {
                console.log("Chess Assistant: Turn change detected");
                currentFEN = newFEN;

                // Determine whose turn it is from the FEN
                const fenParts = currentFEN.split(' ');
                const turnMarker = fenParts[1];
                const isMyTurn = (turnMarker === fenTurnMarker); // your original choice (w/b)

                // Track if the opponent has made a move
                if (!isMyTurn) {
                    // It's opponent's turn now, record their board state
                    lastOpponentBoardState = boardFEN;
                    waitingForOpponentMove = true;
                    updateStatus("Opponent's turn - waiting...");
                } else if (isMyTurn && waitingForOpponentMove) {
                    // It's my turn now and we were previously waiting for opponent's move
                    // This means opponent has moved - record the timestamp
                    waitingForOpponentMove = false;
                    lastOpponentMoveTimestamp = new Date();
                    console.log("%cOpponent moved at: " + lastOpponentMoveTimestamp.toLocaleTimeString(), "color: #3498db; font-weight: bold");
                    
                    // Clear old analysis since the board has changed
                    analysisHistory = [];
                    
                    // Request new analysis after opponent's move - for regular display
                    updateStatus("Your turn - analyzing new position...");
                    stockfishEngine.postMessage(`position fen ${currentFEN}`);
                    stockfishEngine.postMessage(`go depth ${targetAnalysisDepth}`);
                    
                    // After the opponent has moved and it's our turn again,
                    // we can safely auto-play if enabled
                    // Run a quick depth 1 analysis specifically for auto-play
                    if (isAutoPlayActive) {
                        console.log(`%cAuto-play: Running quick depth ${autoPlayAnalysisDepth} analysis after opponent's move`, "color: #2ecc71; font-weight: bold");
                        // We'll use a separate quick analysis for auto-play
                        setTimeout(() => {
                            if (isAutoPlayActive) {
                                stockfishEngine.postMessage('stop'); // Stop current analysis
                                stockfishEngine.postMessage(`position fen ${currentFEN}`);
                                stockfishEngine.postMessage(`go depth ${autoPlayAnalysisDepth}`); // Quick analysis for auto-play
                                
                                // Set a timer to execute auto-play move after depth 1 analysis completes
                                // This should be long enough for depth 1 but short enough to be responsive
                                setTimeout(() => {
                                    if (isAutoPlayActive) {
                                        console.log("%cAuto-play: Timer triggered, checking for valid moves", "color: #2ecc71");
                                        makeAutoPlayMove();
                                    }
                                }, 500); // 500ms should be enough for depth 1 analysis
                            }
                        }, 100); // Short delay before starting auto-play analysis
                    }
                } else {
                    // It's my turn but not right after opponent's move
                    // This is likely the initial state or after my own move
                    updateStatus("Your turn - waiting for analysis...");
                    stockfishEngine.postMessage(`position fen ${currentFEN}`);
                    stockfishEngine.postMessage(`go depth ${targetAnalysisDepth}`);
                }
            }
        }
    }, 500); // Faster polling interval (500ms) for better responsiveness


    let pendingBestMove = null;

    // Adjusted Stockfish message handler
    stockfishEngine.onmessage = (event) => {
        const message = event.data;

        if (typeof message === 'string') {
            if (message.startsWith('bestmove')) {
                const currentBestMove = message.split(' ')[1];
                pendingBestMove = currentBestMove;
                updateAnalysisHistory(currentBestMove, null, null, true);
                displaySuggestion(currentBestMove, chessBoardElement);
                updateStatus(`Suggested Move: ${currentBestMove}`);

                // Only check auto-play if it's our turn after an opponent's move
                // We'll handle auto-play in the board polling function
                // This prevents premoves
            } else if (message.startsWith('info')) {
                const scoreMatch = message.match(/score cp (-?\d+)/);
                const depthMatch = message.match(/depth (\d+)/);
                const pvMatch = message.match(/ pv ([a-h][1-8][a-h][1-8](?:[qrbn])?)/);

                if (scoreMatch && depthMatch && pvMatch) {
                    const score = parseInt(scoreMatch[1]);
                    const depth = parseInt(depthMatch[1]);
                    const currentBestMove = pvMatch[1];

                    updateAnalysisHistory(currentBestMove, score, depth, false);
                    displaySuggestion(currentBestMove, chessBoardElement);
                    updateStatus(`Depth: ${depth} | Score: ${score} | Move: ${currentBestMove}`);
                }
            }
        }
    };


    const displaySuggestion = (move, board) => {
        // Clear any existing highlights first
        board.querySelectorAll(".suggestion-highlight").forEach(el => el.remove());

        // Only show highlights when it's the player's turn (not during opponent's turn)
        if (waitingForOpponentMove) {
            // If we're waiting for opponent's move, don't show highlights
            return;
        }

        // Add opacity to all pieces first
        const allPieces = board.querySelectorAll('.piece');
        allPieces.forEach(piece => {
            piece.style.opacity = '0.8';
        });

        const fileToCoord = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };
        const startSquare = `${fileToCoord[move[0]]}${move[1]}`;
        const endSquare = `${fileToCoord[move[2]]}${move[3]}`;

        // Reset opacity for highlighted pieces
        const startPiece = board.querySelector(`.piece.square-${startSquare}`);
        const endPiece = board.querySelector(`.piece.square-${endSquare}`);
        if (startPiece) startPiece.style.opacity = '1';
        if (endPiece) endPiece.style.opacity = '1';

        const highlightStyle = `
            border: 4px solid #e74c3c;
            box-sizing: border-box;
            pointer-events: none;
            border-radius: 4px;
            box-shadow: 0 0 20px rgba(231, 76, 60, 0.8);
            background: transparent;
            position: absolute;
            z-index: 1000;
            animation: pulse 2s infinite;
        `;

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% {
                    box-shadow: 0 0 20px rgba(231, 76, 60, 0.8);
                }
                50% {
                    box-shadow: 0 0 30px rgba(231, 76, 60, 0.6);
                }
                100% {
                    box-shadow: 0 0 20px rgba(231, 76, 60, 0.8);
                }
            }
        `;
        document.head.appendChild(style);

        [startSquare, endSquare].forEach(squareCoord => {
            const highlightElement = document.createElement("div");
            highlightElement.className = `highlight suggestion-highlight square-${squareCoord}`;
            highlightElement.style.cssText = highlightStyle;
            board.appendChild(highlightElement);
        });
    };

    return { success: true };
}

function updateAnalysisHistory(move, score, depth, isFinal) {
    // Don't add entries with null/undefined values
    if (!move || score === null || score === undefined || !depth) return;

    // Limit depth to reasonable values (1-26)
    if (depth < 1 || depth > 26) return;

    // Check if we already have an entry with this depth
    const lastEntry = analysisHistory[0];
    if (lastEntry && lastEntry.depth === depth && lastEntry.move === move) return;

    // Check for move repetition
    if (move === lastBestMove) {
        moveRepetitionCount++;
        if (moveRepetitionCount >= 3 && depth >= 20) {
            // If the same move has been suggested 3 times at depth 20+, stop searching
            if (stockfishEngine) {
                stockfishEngine.postMessage('stop');
            }
            return;
        }
    } else {
        lastBestMove = move;
        moveRepetitionCount = 1;
    }

    analysisHistory.unshift({
        move,
        score,
        depth,
        isFinal,
        timestamp: new Date().toISOString()
    });

    // Keep only last 100 entries to prevent memory bloat
    if (analysisHistory.length > 100) {
        analysisHistory.pop();
    }

    updateHistoryPanel();
    updateAdvantageIndicator(score);

    // Show/hide auto play button based on whether we have a move
    const autoPlayButton = document.getElementById("auto-play-button");
    if (autoPlayButton) {
        autoPlayButton.style.display = move ? "block" : "none";
        // REMOVED: Don't trigger auto-play here as it can happen before board is updated
        // We'll only trigger auto-play in the board polling function after detecting opponent's move
    }
}

function getMoveRating(score) {
    if (score === null || score === undefined || score === '-') return '-';

    // Checkmate or forced mate
    if (score > 2000) return 'Winning';
    if (score < -2000) return 'Losing';

    // Decisive advantage (usually winning)
    if (score > 1000) return 'Decisive Advantage';
    if (score < -1000) return 'Decisive Disadvantage';

    // Clear advantage (usually winning with best play)
    if (score > 500) return 'Clear Advantage';
    if (score < -500) return 'Clear Disadvantage';

    // Significant advantage (usually winning with best play)
    if (score > 300) return 'Significant Advantage';
    if (score < -300) return 'Significant Disadvantage';

    // Slight advantage (usually equal with best play)
    if (score > 200) return 'Slight Advantage';
    if (score < -200) return 'Slight Disadvantage';

    // Equal position
    return 'Equal';
}

function updateHistoryPanel() {
    const historyPanel = document.getElementById("analysis-history");
    if (!historyPanel) return;

    // Sort history in descending order by timestamp
    const sortedHistory = [...analysisHistory].sort((a, b) =>
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
                        <td style="padding: 8px;">${entry.score || '-'}</td>
                        <td style="padding: 8px;">${getMoveRating(entry.score)}</td>
                        <td style="padding: 8px;">${entry.depth || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function updateStatus(text) {
    const statusElement = document.getElementById("assistant-status");
    if (statusElement) {
        statusElement.textContent = text;
        if (isAutoPlayActive) {
            statusElement.textContent += " (Auto-play active)";
        }
    }
}

function createAssistantInterface() {
    if (document.getElementById("chess-assistant-panel")) return;

    // Main Panel
    const panel = document.createElement("div");
    panel.id = "chess-assistant-panel";
    panel.style.cssText = `
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
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #e9ecef;
        position: relative;
    `;

    const title = document.createElement("h3");
    title.textContent = "Chess Assistant";
    title.style.cssText = `
        margin: 0;
        color: #2c3e50;
        font-size: 1.4em;
    `;

    const controlButton = document.createElement("button");
    controlButton.id = "assistant-control-button";
    controlButton.textContent = "Activate";
    controlButton.style.cssText = `
        background: #2c3e50;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.1em;
        transition: background 0.2s;
    `;
    controlButton.onmouseover = () => controlButton.style.background = '#34495e';
    controlButton.onmouseout = () => controlButton.style.background = '#2c3e50';

    // Collapse/Expand Button
    const collapseButton = document.createElement("button");
    collapseButton.id = "collapse-button";
    collapseButton.textContent = "−";
    collapseButton.style.cssText = `
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
    `;
    collapseButton.onmouseover = () => collapseButton.style.background = '#34495e';
    collapseButton.onmouseout = () => collapseButton.style.background = '#2c3e50';

    let isCollapsed = false;
    collapseButton.onclick = () => {
        isCollapsed = !isCollapsed;
        collapseButton.textContent = isCollapsed ? "+" : "−";

        const content = document.getElementById("assistant-content");
        if (content) {
            content.style.display = isCollapsed ? "none" : "block";
            panel.style.height = isCollapsed ? "100px" : "auto";
            panel.style.width = "400px"; // Keep width constant
        }
    };

    header.appendChild(title);
    header.appendChild(controlButton);
    header.appendChild(collapseButton);

    // Content Container
    const content = document.createElement("div");
    content.id = "assistant-content";
    content.style.cssText = `
        transition: all 0.3s ease;
    `;

    // Color Selection
    const colorContainer = document.createElement("div");
    colorContainer.id = "color-choice-container";
    colorContainer.style.cssText = `
        display: none;
        gap: 15px;
        margin: 20px 0;
        justify-content: center;
    `;

    const createColorButton = (symbol, color) => {
        const button = document.createElement("button");
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
        button.onclick = () => startInitializationWithColor(color);
        return button;
    };

    colorContainer.appendChild(createColorButton("&#9812;", "w"));
    colorContainer.appendChild(createColorButton("&#9818;", "b"));

    // Status Display
    const status = document.createElement("div");
    status.id = "assistant-status";
    status.style.cssText = `
        margin: 15px 0;
        padding: 15px;
        background: #ecf0f1;
        border-radius: 4px;
        font-size: 1.1em;
        color: #2c3e50;
    `;

    // Analysis History
    const history = document.createElement("div");
    history.id = "analysis-history";
    history.style.cssText = `
        max-height: 300px;
        overflow-y: auto;
        margin-top: 20px;
        padding: 15px;
        background: #ecf0f1;
        border-radius: 4px;
        font-size: 1.1em;
    `;

    // Change Color Button
    const changeColorButton = document.createElement("button");
    changeColorButton.id = "change-color-button";
    changeColorButton.textContent = "Change Color";
    changeColorButton.style.cssText = `
        display: none;
        background: #3498db;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.1em;
        margin-top: 15px;
        transition: background 0.2s;
    `;
    changeColorButton.onmouseover = () => changeColorButton.style.background = '#2980b9';
    changeColorButton.onmouseout = () => changeColorButton.style.background = '#3498db';
    changeColorButton.onclick = () => {
        stopAssistant(controlButton);
        promptForColor(controlButton);
    };

    // Add Advantage Indicator
    const advantageIndicator = document.createElement("div");
    advantageIndicator.id = "advantage-indicator";
    advantageIndicator.style.cssText = `
        height: 20px;
        background: #2c3e50;
        border: 2px solid #ffffff;
        border-radius: 10px;
        margin: 15px 0;
        position: relative;
        overflow: hidden;
        box-shadow: 0 0 0 2px #2c3e50;
    `;

    const advantageBar = document.createElement("div");
    advantageBar.id = "advantage-bar";
    advantageBar.style.cssText = `
        position: absolute;
        height: 100%;
        width: 50%;
        background: #ffffff;
        left: 0;
        transition: width 0.3s ease, left 0.3s ease;
        border-radius: 8px;
    `;

    const advantageMarker = document.createElement("div");
    advantageMarker.id = "advantage-marker";
    advantageMarker.style.cssText = `
        position: absolute;
        width: 4px;
        height: 100%;
        background: #e74c3c;
        left: 50%;
        transform: translateX(-50%);
        transition: left 0.3s ease;
    `;

    advantageIndicator.appendChild(advantageBar);
    advantageIndicator.appendChild(advantageMarker);
    content.appendChild(advantageIndicator);

    // Add Auto Play Button
    const autoPlayButton = document.createElement("button");
    autoPlayButton.id = "auto-play-button";
    autoPlayButton.textContent = "Auto Play";
    autoPlayButton.style.cssText = `
        background: #2c3e50;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.1em;
        margin-top: 15px;
        transition: background 0.2s;
        display: none;
    `;
    autoPlayButton.onmouseover = () => {
        if (!isAutoPlayActive) {
            autoPlayButton.style.background = '#34495e';
        }
    };
    autoPlayButton.onmouseout = () => {
        if (!isAutoPlayActive) {
            autoPlayButton.style.background = '#2c3e50';
        }
    };
    autoPlayButton.onclick = () => {
        isAutoPlayActive = !isAutoPlayActive;
        if (isAutoPlayActive) {
            autoPlayButton.style.background = '#2ecc71';
            autoPlayButton.textContent = "Stop Auto Play";
            makeAutoPlayMove();
        } else {
            autoPlayButton.style.background = '#2c3e50';
            autoPlayButton.textContent = "Auto Play";
        }
    };

    content.appendChild(autoPlayButton);

    // Assemble Panel
    panel.appendChild(header);
    content.appendChild(colorContainer);
    content.appendChild(status);
    content.appendChild(history);
    content.appendChild(changeColorButton);
    panel.appendChild(content);

    // Add to Page
    document.body.appendChild(panel);

    // Initial Button Action
    controlButton.onclick = () => promptForColor(controlButton);
}

function promptForColor(controlButton) {
    console.log("Chess Assistant: Finding chessboard element...");
    chessBoardElement = document.querySelector('wc-chess-board');
    if (!chessBoardElement) {
        console.error("Chess Assistant: Chessboard element not found");
        alert("Could not find the chessboard. Make sure you are on a game page.");
        return;
    }

    const choiceContainer = document.getElementById("color-choice-container");
    if (choiceContainer) {
        choiceContainer.style.display = "flex";
        controlButton.textContent = "Choose your color";
        controlButton.disabled = true;
    }
}

function startInitializationWithColor(chosenColor) {
    const controlButton = document.getElementById("assistant-control-button");
    const choiceContainer = document.getElementById("color-choice-container");
    const changeColorButton = document.getElementById("change-color-button");

    if (choiceContainer) {
        choiceContainer.style.display = "none";
    }

    controlButton.textContent = "Initializing...";
    controlButton.disabled = true;
    assistantIsActive = true;
    playerColor = chosenColor; // Stocke la couleur choisie par le joueur

    setTimeout(() => {
        const initResult = initializeChessAssistant(chosenColor);

        if (initResult.success) {
            controlButton.disabled = false;
            controlButton.textContent = "Deactivate";
            controlButton.onclick = () => stopAssistant(controlButton);
            changeColorButton.style.display = "block";
            
            console.log(`%cChess Assistant activé avec la couleur: ${playerColor === 'w' ? 'Blanc' : 'Noir'}`, "color: #2ecc71; font-weight: bold");
        } else {
            alert(`Error: ${initResult.message}`);
            assistantIsActive = false;
            controlButton.textContent = "Activate";
            controlButton.disabled = false;
            controlButton.onclick = () => promptForColor(controlButton);
            changeColorButton.style.display = "none";
        }
    }, 50);
}

function stopAssistant(controlButton) {
    if (boardPollingInterval) {
        clearInterval(boardPollingInterval);
        boardPollingInterval = null;
    }
    if (stockfishEngine) {
        stockfishEngine.terminate();
        stockfishEngine = null;
    }
    if (chessBoardElement) {
        chessBoardElement.querySelectorAll(".suggestion-highlight").forEach(el => el.remove());
    }

    const choiceContainer = document.getElementById("color-choice-container");
    const changeColorButton = document.getElementById("change-color-button");
    if (choiceContainer) {
        choiceContainer.style.display = "none";
    }
    if (changeColorButton) {
        changeColorButton.style.display = "none";
    }

    assistantIsActive = false;
    controlButton.textContent = "Activate";
    controlButton.disabled = false;
    controlButton.onclick = () => promptForColor(controlButton);
}

function updateAdvantageIndicator(score) {
    const bar = document.getElementById("advantage-bar");
    const marker = document.getElementById("advantage-marker");
    if (!bar || !marker) return;

    // Convert score to percentage (0-100)
    const maxScore = 2000;
    let percentage = 50; // Center position

    if (score !== null && score !== undefined) {
        percentage = 50 + (score / maxScore) * 50;
        percentage = Math.max(0, Math.min(100, percentage));
    }

    // Update the bar width and position
    if (percentage > 50) {
        bar.style.width = `${percentage}%`;
        bar.style.left = '0';
        bar.style.background = '#ffffff';
    } else {
        bar.style.width = `${100 - percentage}%`;
        bar.style.left = `${percentage}%`;
        bar.style.background = '#ffffff';
    }

    marker.style.left = `${percentage}%`;
}

function makeAutoPlayMove() {
    if (!isAutoPlayActive) return;

    // Check if the game might be over (e.g., checkmate, stalemate)
    const gameEndMarkers = document.querySelectorAll('.notation-result-component');
    const resultText = document.querySelector('.vertical-result-component');
    if (gameEndMarkers.length > 0 || (resultText && resultText.textContent.includes('Game'))) {
        console.log("%cAuto-play: Game appears to be finished", "color: #e74c3c; font-weight: bold");
        updateStatus("Game over - Auto-play disabled");
        
        // Turn off auto-play automatically at game end
        const autoPlayButton = document.getElementById("auto-play-button");
        if (autoPlayButton) {
            isAutoPlayActive = false;
            autoPlayButton.style.background = '#2c3e50';
            autoPlayButton.textContent = "Auto Play";
        }
        return;
    }
    
    // Always check what's currently displayed in the UI first
    const statusElement = document.getElementById("assistant-status");
    let suggestedMove = null;
    
    if (statusElement) {
        const statusText = statusElement.textContent;
        const moveMatch = statusText.match(/Suggested Move: ([a-h][1-8][a-h][1-8])/);
        if (moveMatch && moveMatch[1]) {
            suggestedMove = moveMatch[1];
            console.log("%cAuto-play: Found suggested move in UI: " + suggestedMove, "color: #2ecc71; font-weight: bold");
        }
    }

    // Create a mock move entry if we found a suggested move in the UI
    let moveToUse = null;
    
    if (suggestedMove) {
        moveToUse = {
            move: suggestedMove,
            timestamp: new Date().toISOString(),
            depth: 99,  // Special depth to indicate this is from UI
            isFinal: true
        };
    } else {
        // Only look for moves calculated AFTER the opponent's latest move
        const validMoves = analysisHistory.filter(entry => {
            // Check if the move was calculated after opponent's last move
            if (!lastOpponentMoveTimestamp) return false;
            const moveTime = new Date(entry.timestamp);
            // Use specific depth moves for auto-play
            return moveTime > lastOpponentMoveTimestamp && entry.depth === autoPlayAnalysisDepth;
        });
    
        // If no valid moves found at the requested depth, try to find any move
        if (validMoves.length === 0) {
            console.log(`%cAuto-play: No valid depth ${autoPlayAnalysisDepth} moves found after opponent's last move - using best available move`, "color: #e74c3c");
            
            // First, try to find the most recent bestmove of any depth
            const anyDepthMoves = analysisHistory.filter(entry => {
                if (!lastOpponentMoveTimestamp) return false;
                const moveTime = new Date(entry.timestamp);
                return moveTime > lastOpponentMoveTimestamp;
            });
            
            if (anyDepthMoves.length > 0) {
                // Sort by isFinal (bestmove) first, then by depth
                anyDepthMoves.sort((a, b) => {
                    if (a.isFinal && !b.isFinal) return -1;
                    if (!a.isFinal && b.isFinal) return 1;
                    return b.depth - a.depth; // Higher depth preferred
                });
                
                moveToUse = anyDepthMoves[0];
                console.log(`%cAuto-play: Using alternative move ${moveToUse.move} at depth ${moveToUse.depth}`, "color: #3498db; font-weight: bold");
            } else {
                // If still no moves, check for any move from history, even from before opponent's move
                // This is a last resort
                if (analysisHistory.length > 0) {
                    moveToUse = analysisHistory[0];
                    console.log(`%cAuto-play: Using last resort move ${moveToUse.move}`, "color: #e67e22; font-weight: bold");
                }
            }
        } else {
            // Use the best valid move at our target depth
            moveToUse = validMoves[0];
        }
    }

    // Exit if we still couldn't find a move
    if (!moveToUse || !moveToUse.move) {
        console.log("%cAuto-play: Could not find any valid move to play", "color: #e74c3c; font-weight: bold");
        return;
    }

    console.log("%cAuto-play: Attempting move " + moveToUse.move, "color: #2ecc71; font-weight: bold; font-size: 14px");
    const chessBoard = document.querySelector('wc-chess-board');
    if (!chessBoard) {
        console.error("Auto-play: Chess board not found");
        return;
    }

    const queryRoot = chessBoard.shadowRoot || chessBoard;
    console.log(`%cQuerying within: ${chessBoard.shadowRoot ? 'Shadow DOM' : 'Light DOM'}`, "color: #e67e22");

    try {
        // Convert move to proper format and log details
        const from = moveToUse.move.substring(0, 2);
        const to = moveToUse.move.substring(2, 4);
        console.log(`%cMove details: From ${from} to ${to}`, "color: #3498db");

        // Check if this might be a promotion move (a pawn moving to the last rank)
        const isPossiblePromotion = (from[0] >= 'a' && from[0] <= 'h' && 
                                   ((playerColor === 'w' && from[1] === '7' && to[1] === '8') || 
                                    (playerColor === 'b' && from[1] === '2' && to[1] === '1')));
        
        if (isPossiblePromotion) {
            console.log("%cDetected possible pawn promotion move!", "color: #e74c3c; font-weight: bold");
        }

        // --- Method 1 (Attempt, but likely won't work based on tests) --- 
        console.log("%cAttempting Method 1: Dispatch custom board-move event (Low confidence)", "color: #f1c40f;");
        try {
            const boardMoveEvent = new CustomEvent('board-move', { detail: { from, to }, bubbles: true, cancelable: true });
            chessBoard.dispatchEvent(boardMoveEvent);
        } catch (e) { console.error("Method 1 Error:", e); }

        // --- Method 2 (Attempt, but likely won't work based on tests) --- 
        console.log("%cAttempting Method 2: Call board.move() (Low confidence)", "color: #f1c40f;");
        if (typeof chessBoard.move === 'function') {
            try { chessBoard.move(from, to); } catch (e) { console.error("Method 2 Error:", e); }
        } else { console.log("Method 2: board.move() function not found."); }

        // --- Method 3: Simulate Manual Click Sequence (High confidence based on logs) --- 
        console.log("%cAttempting Method 3: Simulate Manual Click Sequence", "color: #2ecc71; font-weight: bold;");

        // Create visual indicators (optional, can be commented out)
        const createClickIndicator = (x, y, color) => {
            const indicator = document.createElement('div');
            indicator.style.cssText = `position:fixed;width:15px;height:15px;background:${color};border-radius:50%;opacity:0.6;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:opacity 0.5s;box-shadow:0 0 8px ${color};`;
            indicator.style.left = x + 'px';
            indicator.style.top = y + 'px';
            document.body.appendChild(indicator);
            setTimeout(() => { indicator.style.opacity = '0'; setTimeout(() => indicator.remove(), 500); }, 800);
        };

        // Find elements and calculate coordinates
        const fileMap = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
        const rankMap = { 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 0 };

        // For black pieces, we need to adjust the coordinates since the board is flipped
        let fromFile = fileMap[from[0]];
        let fromRank = parseInt(from[1]);
        let toFile = fileMap[to[0]];
        let toRank = parseInt(to[1]);
        
        // When playing as black, chess.com flips the board, so we need to adjust coordinates
        console.log(`%cPlayer is playing as: ${playerColor === 'w' ? 'White' : 'Black'}`, "color: #3498db; font-weight: bold");

        // Different boards renderers have different selectors
        // First try the normal format (most common)
        let fromElement = queryRoot.querySelector(`.piece.square-${fromFile + 1}${fromRank}`);

        // If not found, let's try with the square- prefix (alternative format)
        if (!fromElement) {
            // Board might be flipped for black perspective
            if (playerColor === 'b') {
                // Invert the file index for black (a→h, b→g, etc.)
                fromElement = queryRoot.querySelector(`.piece.square-${8-fromFile}${fromRank}`);
            }
        }

        // If still not found, try with x/y coordinates
        if (!fromElement) {
            fromElement = queryRoot.querySelector(`.piece[class*="square-${fromFile + 1}${fromRank}"]`);
        }

        const svgTarget = queryRoot.querySelector('svg.coordinates'); // Target the SVG overlay

        if (!fromElement || !svgTarget) {
            console.error("Method 3 Error: Could not find source piece or target SVG element.");
            console.error("Attempted to find:", `.piece.square-${fromFile + 1}${fromRank}`);
            
            // Last resort: try to find ANY piece
            const anyPiece = queryRoot.querySelector('.piece');
            if (anyPiece) {
                console.log("Found at least one piece on board:", anyPiece);
                console.log("All pieces on board:", queryRoot.querySelectorAll('.piece').length);
                console.log("All piece elements:", Array.from(queryRoot.querySelectorAll('.piece')).map(el => el.className));
            } else {
                console.error("No pieces found on board at all");
            }
            
            return; // Stop if elements aren't found
        }

        const boardRect = chessBoard.getBoundingClientRect();
        const squareWidth = boardRect.width / 8;
        const squareHeight = boardRect.height / 8;

        const fromRect = fromElement.getBoundingClientRect();
        const fromX = fromRect.left + fromRect.width / 2;
        const fromY = fromRect.top + fromRect.height / 2;
        
        // Calculate target coordinates based on player color
        let toX, toY;
        if (playerColor === 'w') {
            // White perspective (a1 is bottom-left)
            toX = boardRect.left + (toFile * squareWidth) + (squareWidth / 2);
            toY = boardRect.top + (rankMap[toRank] * squareHeight) + (squareHeight / 2);
        } else {
            // Black perspective (a1 is top-right)
            toX = boardRect.left + ((7-toFile) * squareWidth) + (squareWidth / 2);
            toY = boardRect.top + ((7-rankMap[toRank]) * squareHeight) + (squareHeight / 2);
        }

        console.log(`Board dimensions: ${boardRect.width}x${boardRect.height}`);
        console.log(`Source coords: X=${fromX.toFixed(1)}, Y=${fromY.toFixed(1)}`);
        console.log(`Target coords: X=${toX.toFixed(1)}, Y=${toY.toFixed(1)}`);
        console.log(`Source element:`, fromElement);
        console.log(`Target element:`, svgTarget);

        // Create mouse event function (adding pointerType for potential compatibility)
        const createPointerEvent = (type, x, y) => {
            return new PointerEvent(type, {
                bubbles: true, cancelable: true, view: window,
                button: 0, buttons: type === 'pointerdown' ? 1 : 0,
                clientX: x, clientY: y, screenX: x, screenY: y,
                pointerId: 1, width: 1, height: 1, pressure: 0.5,
                isPrimary: true, pointerType: 'mouse' // Specify pointerType
            });
        };
        const createMouseEvent = (type, x, y) => {
            return new MouseEvent(type, {
                bubbles: true, cancelable: true, view: window,
                button: 0, buttons: type === 'mousedown' ? 1 : 0,
                clientX: x, clientY: y, screenX: x, screenY: y,
                detail: 1 // Added detail based on logs
            });
        }

        // Dispatch full sequence: pointerdown -> mousedown -> pointerup -> mouseup -> click
        const dispatchSequence = (element, x, y, label) => {
            element.dispatchEvent(createPointerEvent('pointerdown', x, y));
            element.dispatchEvent(createMouseEvent('mousedown', x, y));
            element.dispatchEvent(createPointerEvent('pointerup', x, y));
            element.dispatchEvent(createMouseEvent('mouseup', x, y));
            element.dispatchEvent(createPointerEvent('click', x, y)); // Also dispatch pointer click
            element.dispatchEvent(createMouseEvent('click', x, y));
        };

        createClickIndicator(fromX, fromY, '#e74c3c'); // Source indicator
        dispatchSequence(fromElement, fromX, fromY, 'Source');

        // Add a slight delay before the second click simulation
        setTimeout(() => {
            createClickIndicator(toX, toY, '#2ecc71'); // Target indicator
            dispatchSequence(svgTarget, toX, toY, 'Target (SVG)');
            
            // After making our move, update board state to wait for opponent's move
            setTimeout(() => {
                console.log("%cAuto-play: Resetting board state after our move", "color: #3498db; font-weight: bold");
                
                // Check one more time for promotion dialog before updating board state
                const promotionBox = document.querySelector('.promotion-piece-selector');
                if (promotionBox && window.getComputedStyle(promotionBox).display !== 'none') {
                    console.log("%cAuto-play: Promotion dialog still detected, attempting queen selection again", "color: #9b59b6; font-weight: bold");
                    
                    const promotionPieces = promotionBox.querySelectorAll('.promotion-piece');
                    if (promotionPieces.length > 0) {
                        try {
                            // Just use the same click handling as before
                            const queen = promotionPieces[0]; // Queen is typically first
                            const queenRect = queen.getBoundingClientRect();
                            const clickX = queenRect.left + queenRect.width / 2;
                            const clickY = queenRect.top + queenRect.height / 2;
                            
                            // Visual indicator
                            createClickIndicator(clickX, clickY, '#9b59b6');
                            
                            // Use the same dispatchSequence function we used for the main move
                            dispatchSequence(queen, clickX, clickY, 'Promotion-Queen');
                            
                            console.log("%cAuto-play: Second queen selection attempt complete", "color: #2ecc71; font-weight: bold");
                            
                            // Add extra delay to allow promotion to complete
                            setTimeout(() => {
                                const currentBoardFEN = chessBoardElement ? generateFENString() : null;
                                if (currentBoardFEN) {
                                    lastOpponentBoardState = currentBoardFEN;
                                    waitingForOpponentMove = true;
                                    updateStatus("Opponent's turn - waiting... (Auto-play active)");
                                    console.log("%cAuto-play: Now waiting for opponent's move after promotion", "color: #3498db");
                                }
                            }, 500);
                            
                            return; // Exit early after handling promotion
                        } catch (e) {
                            console.error("Auto-play: Failed to handle promotion (second attempt)", e);
                        }
                    }
                }
                
                // Normal flow if no promotion dialog is visible
                const currentBoardFEN = chessBoardElement ? generateFENString() : null;
                if (currentBoardFEN) {
                    lastOpponentBoardState = currentBoardFEN;
                    waitingForOpponentMove = true;
                    updateStatus("Opponent's turn - waiting... (Auto-play active)");
                    console.log("%cAuto-play: Now waiting for opponent's move", "color: #3498db");
                }
            }, 800); // Wait longer to make sure the board has updated, including after promotion
        }, 150); // 150ms delay

    } catch (error) {
        console.error("Auto-play: Global error during move attempt:", error);
    }
}

// --- Entry Point: Create the assistant interface when the page is ready --- 
if (document.readyState === "complete" || document.readyState === "interactive") {
    createAssistantInterface();

    // Add a global click listener to debug promotion interactions
    document.addEventListener('click', function(e) {
        // Check if this might be a promotion-related click
        const promotionBox = document.querySelector('.promotion-piece-selector');
        if (promotionBox && window.getComputedStyle(promotionBox).display !== 'none') {
            console.log("%c===== PROMOTION CLICK DETECTED =====", "background: #9b59b6; color: white; font-weight: bold; padding: 5px;");
            console.log("Clicked element:", e.target);
            console.log("Element classes:", e.target.className);
            console.log("Element ID:", e.target.id);
            console.log("Element tag:", e.target.tagName);
            console.log("Parent element:", e.target.parentElement);
            
            // If we can identify the promotion piece being clicked
            if (e.target.closest('.promotion-piece')) {
                const piece = e.target.closest('.promotion-piece');
                console.log("Promotion piece clicked:", piece);
                console.log("Piece index:", Array.from(promotionBox.querySelectorAll('.promotion-piece')).indexOf(piece));
                
                // Get all selectors that might help us identify this element later
                const pieceClasses = Array.from(piece.classList);
                console.log("Piece classes:", pieceClasses);
                
                // Log coordinates for click simulation
                const rect = piece.getBoundingClientRect();
                console.log("Piece coordinates:", {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    centerX: rect.left + rect.width / 2,
                    centerY: rect.top + rect.height / 2
                });
            }
            
            // Log the entire promotion box structure
            console.log("Promotion box structure:", promotionBox.outerHTML);
            console.log("%c===== END PROMOTION CLICK INFO =====", "background: #9b59b6; color: white; font-weight: bold; padding: 5px;");
        }
    }, true);
} else {
    document.addEventListener("DOMContentLoaded", createAssistantInterface);
}
