<div align="center">
  <img src="ressources/icon.png" alt="Chess Cheat Assistant Icon" width="200" />
  <h1>♔ Chess Cheat Assistant ♕<br></h1>
  <p><b>nolancacheux/chess-cheat-assistant</b></p>
  <p><i>🚀 Advanced Chess Analysis & Learning Tool for chess.com</i></p>
  <p><strong>Educational Chrome Extension | Real-time Stockfish Analysis | Interactive Chess Learning</strong></p>
</div>

---

## 🎯 Overview

**Chess Cheat Assistant** is a comprehensive educational Chrome extension designed for chess.com that provides real-time chess analysis, move suggestions, and learning opportunities. This tool demonstrates how modern chess engines work, how browser extensions interact with web applications, and how automated chess analysis can enhance your understanding of the game.

### 🔥 Key Features at a Glance
- **Real-time Stockfish Analysis** - Live position evaluation with configurable depth
- **Intelligent Move Suggestions** - Best move recommendations with visual highlighting  
- **Advantage Tracking** - Dynamic visual representation of position evaluation
- **Educational Focus** - Learn chess engine mechanics and browser automation
- **Interactive Interface** - User-friendly controls and real-time feedback
- **Open Source** - MIT licensed for learning and research

### 🎓 Perfect For
- **Chess Students** learning position evaluation and tactics
- **Developers** interested in browser automation and chess APIs
- **Researchers** studying chess engines and AI decision-making
- **Chess Enthusiasts** wanting to understand engine analysis

---
<div align="center">
  <img src="ressources/ChessCheatAssistant.gif" width="700" alt="Chess Cheat Assistant Demo" />
</div>
---

---

## 🚀 Getting Started

### Quick Installation

1. **📥 Clone the repository:**
   ```bash
   git clone https://github.com/nolancacheux/chess-cheat-assistant.git
   cd chess-cheat-assistant
   ```

2. **📦 Install dependencies:**
   ```bash
   npm install
   ```

3. **🔧 Load the extension in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top-right)
   - Click **Load Unpacked** and select the project folder
   - The Chess Cheat Assistant icon should appear in your extensions

4. **♟️ Start using:**
   - Go to [chess.com](https://chess.com) and start any game
   - The assistant will automatically detect the board
   - Click the assistant interface to begin analysis

---

## ✨ Features

### 🧠 Real-Time Move Analysis
<div align="center">
  <img src="ressources/real-time-suggestion.png" alt="Real-Time Suggestion" width="400" />
</div>
As soon as you activate the assistant, it connects to the chess.com board and uses a built-in Stockfish engine to analyze the current position. You’ll see the best move, evaluation score, and analysis depth update live as the game progresses.

### 📊 Advantage Tracking
<div align="center">
  <img src="ressources/full-board.png" alt="Full Board Analysis" width="400" />
</div>
A dynamic advantage bar that visually represents which side is ahead, based on the engine’s evaluation.

### 🎨 Color Selection & Board Orientation
<div align="center">
  <img src="ressources/color-choose.png" alt="Color Selection" width="400" />
</div>
You can choose to play as White or Black, and the assistant adapts its analysis and move suggestions accordingly. Can be useful for players who want to practice against the engine or analyze their own games.

### 🏆 Level Maximum defeated (3200 Elos) 
<div align="center">
  <img src="ressources/maximum-level-win.png" alt="Advantage Tracking" width="400" />
</div>
The assistant has won against the maximum level of chess.com, which is 3200 Elos.

---

## 📚 Educational Purpose 

This extension is designed for <b>educational and research purposes only</b>. It helps you understand how chess engines and browser-based chess assistants work, so you can learn about move analysis, position evaluation, and the technology behind chess improvement tools. <b>Do not use this tool to cheat in online games</b>—it is meant to foster learning, awareness, and fair play. Using such tools during live games is against the rules of chess platforms and can result in bans. Please use responsibly!

---

## 🤔 What is Chess Cheat Assistant?

Chess Cheat Assistant is a powerful, interactive browser extension for chess.com that demonstrates how a chess engine can analyze positions, suggest moves, and even automate play. It’s a hands-on way to explore:
- How Stockfish and other chess engines evaluate positions
- How browser extensions can interact with chess boards
- The difference between human and computer move selection
- The technical side of chess automation and move visualization

---

## ⚙️ How Does It Work? (Technical Overview)
- <b>Board State Extraction:</b> The extension reads the chess.com board and generates a FEN string for the current position.
- <b>Stockfish Integration:</b> A web worker runs Stockfish in the background, analyzing the position at configurable depth.
- <b>Move Highlighting:</b> The assistant overlays custom HTML/CSS highlights on the board, using animation for visibility.
- <b>Auto-Play:</b> The assistant simulates mouse events to move pieces, demonstrating browser automation techniques.
- <b>Analysis History:</b> All engine outputs are logged and displayed in a sortable, filterable table.
- <b>Advantage Bar:</b> The evaluation is mapped to a visual bar for instant feedback.

---

## 📜 Repository & License
- **🔗 Repository:** https://github.com/nolancacheux/chess-cheat-assistant
- **📄 License:** MIT License - Free for educational and research use
- **👨‍💻 Author:** Nolan Cacheux
- **🐛 Issues:** Report bugs and feature requests on GitHub
- **⭐ Contributions:** Pull requests welcome for improvements and features

### 🏷️ Keywords & Tags
Chess Analysis, Stockfish Engine, Browser Extension, Educational Tool, Chess Learning, Position Evaluation, Move Suggestions, Chess.com Assistant, Real-time Analysis, Chess AI, Educational Software, Open Source Chess Tool
