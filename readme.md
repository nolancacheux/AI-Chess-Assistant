<div align="center">
  <img src="ressources/icon.png" alt="AI Chess Assistant" width="120" />
  <h1>AI Chess Assistant</h1>
  <p><strong>Chrome Extension for Real-Time Chess Position Analysis</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#project-structure">Project Structure</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-5.2-purple?logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-green?logo=googlechrome" alt="Chrome Extension" />
    <img src="https://github.com/nolancacheux/AI-Chess-Assistant/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </p>
</div>

---

<div align="center">
  <img src="ressources/ChessCheatAssistant.gif" width="700" alt="AI Chess Assistant Demo" />
</div>

---

## Overview

AI Chess Assistant is a Chrome extension that demonstrates **real-time chess engine integration** with web-based chess platforms. The extension leverages the **Stockfish chess engine** to analyze board positions, evaluate moves, and provide intelligent suggestions.

This project showcases:
- **Real-time position analysis** using WebWorker-based engine communication
- **DOM manipulation** for board state extraction and move visualization
- **Event-driven architecture** with TypeScript for type-safe development
- **Modern build tooling** with Vite and automated CI/CD

## Features

### Real-Time Position Analysis
The extension continuously monitors the chess board, extracts the current position in FEN notation, and sends it to the Stockfish engine for deep analysis.

<div align="center">
  <img src="ressources/real-time-suggestion.png" alt="Real-Time Analysis" width="400" />
</div>

### Move Evaluation & Scoring
Each analyzed position receives a centipawn score indicating the advantage/disadvantage, along with the principal variation (best line of play).

### Visual Move Suggestions
Suggested moves are highlighted directly on the board with animated visual indicators, making it easy to identify optimal plays.

<div align="center">
  <img src="ressources/full-board.png" alt="Board Analysis" width="400" />
</div>

### Advantage Tracking
A dynamic progress bar visualizes the current position evaluation, providing instant feedback on game state.

### Color Selection
Choose to analyze from White or Black's perspective, with the engine adapting its evaluation accordingly.

<div align="center">
  <img src="ressources/color-choose.png" alt="Color Selection" width="400" />
</div>

## Architecture

The extension follows a **modular, service-oriented architecture**:

```
src/
├── types/          # TypeScript interfaces and type definitions
│   ├── chess.types.ts      # Chess-related types (FEN, moves, scores)
│   ├── engine.types.ts     # Engine communication types
│   └── ui.types.ts         # UI component types
├── services/       # Core services with single responsibilities
│   ├── board.service.ts    # Board state extraction & FEN generation
│   └── engine.service.ts   # Stockfish WebWorker communication
├── components/     # UI components
│   ├── panel.component.ts  # Main control panel
│   └── highlights.component.ts  # Move highlighting
├── core/           # Business logic
│   ├── analysis.manager.ts # Analysis history & state management
│   └── autoplay.manager.ts # Automated move execution
├── utils/          # Utility functions
│   ├── chess.utils.ts      # Chess-specific helpers
│   └── dom.utils.ts        # DOM manipulation utilities
└── content/        # Entry point
    ├── index.ts            # Content script initialization
    └── assistant.ts        # Main orchestrator class
```

### Key Design Patterns

- **Service Pattern**: Encapsulated services for board interaction and engine communication
- **Observer Pattern**: Event-based engine updates with subscription model
- **Singleton Pattern**: Single instance services for consistent state management
- **Facade Pattern**: ChessAssistant class orchestrates all subsystems

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **TypeScript 5.4** | Type-safe development with strict mode |
| **Vite 5.2** | Fast builds with HMR and optimized bundling |
| **CRXJS** | Chrome extension development with Vite |
| **ESLint** | Code quality and consistency |
| **Prettier** | Code formatting |
| **GitHub Actions** | CI/CD pipeline (lint, type-check, build) |
| **Stockfish** | Chess engine for position analysis |

## Getting Started

### Prerequisites
- Node.js 18+
- Chrome browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nolancacheux/AI-Chess-Assistant.git
   cd AI-Chess-Assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with the compiled extension.

4. **Load in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top-right corner)
   - Click **Load Unpacked**
   - Select the `dist/` folder from this project (e.g., `AI-Chess-Assistant/dist/`)

5. **Use the extension**
   - Go to [chess.com](https://chess.com)
   - Start a game
   - The assistant panel will appear automatically

### Development

```bash
# Start development mode with watch
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check

# Format code
npm run format
```

## Project Structure

```
AI-Chess-Assistant/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI pipeline
├── assets/                  # Extension icons
├── ressources/              # Documentation images
├── src/                     # Source code (TypeScript)
├── dist/                    # Built extension (generated)
├── manifest.json            # Chrome extension manifest
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── .eslintrc.cjs            # ESLint configuration
└── .prettierrc              # Prettier configuration
```

## Technical Highlights

### FEN Generation
The board service extracts piece positions from the DOM and generates standard FEN notation for engine analysis:

```typescript
public generateFEN(): FENString {
  // Iterates through board squares
  // Maps CSS classes to piece symbols
  // Returns standard FEN string
}
```

### Engine Communication
Asynchronous communication with Stockfish via WebWorker:

```typescript
public analyze(fen: FENString, depth?: Depth): void {
  this.worker.postMessage(`position fen ${fen}`);
  this.worker.postMessage(`go depth ${depth}`);
}
```

### Event-Driven Updates
Subscribers receive real-time analysis updates:

```typescript
engine.subscribe((event: EngineEvent) => {
  if (event.type === 'bestmove') {
    // Handle best move found
  }
});
```

## Educational Purpose

This extension is designed for **educational and research purposes**. It demonstrates:
- Chess engine integration techniques
- Browser extension architecture
- Real-time DOM manipulation
- WebWorker communication patterns

**Important**: Do not use this tool to gain unfair advantages in online games.

## License

MIT License - See [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Built by <a href="https://github.com/nolancacheux">Nolan Cacheux</a></p>
</div>
