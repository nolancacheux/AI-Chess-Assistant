<div align="center">
  <img src="ressources/icon.png" alt="Chess Cheat Assistant Icon" width="200" />
  <h1>Chess Cheat Assistant <br></h1>
  <p><b>nolancacheux/chess-cheat-assistant</b></p>
  <p><i>Chess Assistant for chess.com</i></p>
</div>

---
<div align="center">
  <img src="ressources/ChessCheatAssistant.gif" width="700" alt="Chess Cheat Assistant Demo" />
</div>
---
## Getting Started

1. <b>Clone the repository:</b>
   ```bash
   git clone https://github.com/nolancacheux/chess-cheat-assistant.git
   ```
2. <b>Load the extension in Chrome:</b>
   - Go to <code>chrome://extensions/</code>
   - Enable <b>Developer Mode</b>
   - Click <b>Load Unpacked</b> and select the project folder you cloned. (e.g., `chess-cheat-assistant`)
3. <b>Go to chess.com and start a game.</b>
4. <b>Activate the assistant.</b>

---

## Features

### Real-Time Move Analysis
<div align="center">
  <img src="ressources/real-time-suggestion.png" alt="Real-Time Suggestion" width="400" />
</div>
As soon as you activate the assistant, it connects to the chess.com board and uses a built-in Stockfish engine to analyze the current position. You’ll see the best move, evaluation score, and analysis depth update live as the game progresses.

### Advantage Tracking
<div align="center">
  <img src="ressources/full-board.png" alt="Full Board Analysis" width="400" />
</div>
A dynamic advantage bar that visually represents which side is ahead, based on the engine’s evaluation.

### Color Selection & Board Orientation
<div align="center">
  <img src="ressources/color-choose.png" alt="Color Selection" width="400" />
</div>
You can choose to play as White or Black, and the assistant adapts its analysis and move suggestions accordingly. Can be useful for players who want to practice against the engine or analyze their own games.

### Level Maximum defeated (3200 Elos) 
<div align="center">
  <img src="ressources/maximum-level-win.png" alt="Advantage Tracking" width="400" />
</div>
The assistant has won against the maximum level of chess.com, which is 3200 Elos.

---

## Educational Purpose 

This extension is designed for <b>educational and research purposes only</b>. It helps you understand how chess engines and browser-based chess assistants work, so you can learn about move analysis, position evaluation, and the technology behind chess improvement tools. <b>Do not use this tool to cheat in online games</b>—it is meant to foster learning, awareness, and fair play. Using such tools during live games is against the rules of chess platforms and can result in bans. Please use responsibly!

---

## What is Chess Cheat Assistant?

Chess Cheat Assistant is a powerful, interactive browser extension for chess.com that demonstrates how a chess engine can analyze positions, suggest moves, and even automate play. It’s a hands-on way to explore:
- How Stockfish and other chess engines evaluate positions
- How browser extensions can interact with chess boards
- The difference between human and computer move selection
- The technical side of chess automation and move visualization

---

## How Does It Work? (Technical Overview)
- <b>Board State Extraction:</b> The extension reads the chess.com board and generates a FEN string for the current position.
- <b>Stockfish Integration:</b> A web worker runs Stockfish in the background, analyzing the position at configurable depth.
- <b>Move Highlighting:</b> The assistant overlays custom HTML/CSS highlights on the board, using animation for visibility.
- <b>Auto-Play:</b> The assistant simulates mouse events to move pieces, demonstrating browser automation techniques.
- <b>Analysis History:</b> All engine outputs are logged and displayed in a sortable, filterable table.
- <b>Advantage Bar:</b> The evaluation is mapped to a visual bar for instant feedback.

---

## Repository & License
- <b>Repository:</b> https://github.com/nolancacheux/chess-cheat-assistant
- <b>License:</b> MIT
- <b>Author:</b> Nolan Cacheux
