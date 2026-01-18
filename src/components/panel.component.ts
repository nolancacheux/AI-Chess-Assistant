/**
 * Panel Component - Compact draggable UI panel for the chess assistant
 */

import type { AnalysisEntry, ColorSelectionCallback, PlayerColor, Score } from '@/types';
import { createElement } from '@/utils';
import { getMoveRating, scoreToPercentage } from '@/utils/chess.utils';

const PANEL_ID = 'chess-assistant-panel';

interface PanelCallbacks {
  onActivate: () => void;
  onDeactivate: () => void;
  onColorSelect: ColorSelectionCallback;
  onAutoPlayToggle: (active: boolean) => void;
}

/**
 * Chess Assistant Panel - Compact & Draggable
 */
export class PanelComponent {
  private panel: HTMLElement | null = null;
  private callbacks: PanelCallbacks;
  private isAutoPlayActive = false;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private hasDragged = false;

  constructor(callbacks: PanelCallbacks) {
    this.callbacks = callbacks;
  }

  public create(): void {
    if (document.getElementById(PANEL_ID)) return;
    this.injectStyles();
    this.panel = this.createPanel();
    document.body.appendChild(this.panel);
    this.setupDragListeners();
  }

  public destroy(): void {
    this.panel?.remove();
    this.panel = null;
  }

  public updateStatus(text: string): void {
    const el = document.getElementById('ca-status');
    if (el) {
      el.textContent = this.isAutoPlayActive ? `${text} (Auto)` : text;
    }
  }

  public showColorSelection(): void {
    const container = document.getElementById('ca-colors');
    const btn = document.getElementById('ca-main-btn');
    if (container) container.style.display = 'flex';
    if (btn) {
      btn.textContent = 'Select Color';
      (btn as HTMLButtonElement).disabled = true;
      btn.classList.add('disabled');
    }
  }

  public showActiveState(): void {
    const container = document.getElementById('ca-colors');
    const btn = document.getElementById('ca-main-btn');
    const actions = document.getElementById('ca-actions');

    if (container) container.style.display = 'none';
    if (btn) {
      btn.textContent = 'Stop';
      (btn as HTMLButtonElement).disabled = false;
      btn.classList.remove('disabled');
      btn.classList.add('stop');
    }
    if (actions) actions.style.display = 'flex';
  }

  public showInactiveState(): void {
    const container = document.getElementById('ca-colors');
    const btn = document.getElementById('ca-main-btn');
    const actions = document.getElementById('ca-actions');

    if (container) container.style.display = 'none';
    if (btn) {
      btn.textContent = 'Start';
      (btn as HTMLButtonElement).disabled = false;
      btn.classList.remove('disabled', 'stop');
    }
    if (actions) actions.style.display = 'none';
    this.isAutoPlayActive = false;

    const autoBtn = document.getElementById('ca-auto-btn');
    if (autoBtn) {
      autoBtn.classList.remove('active');
      autoBtn.textContent = 'Auto';
    }
  }

  public updateHistory(history: AnalysisEntry[]): void {
    const el = document.getElementById('ca-history');
    if (!el) return;

    const sorted = [...history].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (sorted.length === 0) {
      el.innerHTML = '<div class="ca-empty">No moves analyzed yet</div>';
      return;
    }

    el.innerHTML = sorted
      .slice(0, 5)
      .map((entry, i) => {
        const rating = getMoveRating(entry.score);
        const ratingClass = rating.toLowerCase();
        const scoreDisplay = entry.score !== null
          ? (entry.score >= 0 ? '+' : '') + (entry.score / 100).toFixed(1)
          : '?';
        return `
          <div class="ca-move ${i === 0 ? 'latest' : ''}">
            <span class="ca-move-name">${entry.move || '—'}</span>
            <span class="ca-move-score">${scoreDisplay}</span>
            <span class="ca-move-rating ${ratingClass}">${rating}</span>
          </div>
        `;
      })
      .join('');
  }

  public updateAdvantage(score: Score | null): void {
    const fill = document.getElementById('ca-bar-fill');
    const label = document.getElementById('ca-score-label');
    if (!fill || !label) return;

    const pct = scoreToPercentage(score);
    fill.style.width = `${pct}%`;

    if (score !== null) {
      const val = score / 100;
      label.textContent = (val >= 0 ? '+' : '') + val.toFixed(1);
      label.className = `ca-score-label ${val >= 0 ? 'white' : 'black'}`;
    } else {
      label.textContent = '0.0';
      label.className = 'ca-score-label';
    }
  }

  private injectStyles(): void {
    if (document.getElementById('ca-styles')) return;

    const style = document.createElement('style');
    style.id = 'ca-styles';
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        top: 16px;
        right: 16px;
        width: 260px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        color: #1a1a1a;
        z-index: 10000;
        overflow: hidden;
        user-select: none;
      }

      .ca-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        background: #f8f9fa;
        border-bottom: 1px solid #e5e5e5;
        cursor: grab;
      }
      .ca-header:active { cursor: grabbing; }

      .ca-title {
        font-weight: 600;
        font-size: 14px;
        color: #333;
        letter-spacing: -0.2px;
      }

      .ca-header-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: #e5e5e5;
        color: #666;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
      }
      .ca-header-btn:hover { background: #d5d5d5; }

      .ca-body {
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ca-bar-container {
        position: relative;
      }
      .ca-bar {
        height: 8px;
        background: #1a1a1a;
        border-radius: 4px;
        overflow: hidden;
      }
      .ca-bar-fill {
        height: 100%;
        width: 50%;
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      .ca-score-label {
        position: absolute;
        top: -18px;
        right: 0;
        font-size: 12px;
        font-weight: 700;
        color: #666;
      }
      .ca-score-label.white { color: #16a34a; }
      .ca-score-label.black { color: #dc2626; }

      .ca-main-btn {
        width: 100%;
        padding: 10px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        background: #2563eb;
        color: #fff;
        transition: all 0.2s;
      }
      .ca-main-btn:hover { background: #1d4ed8; }
      .ca-main-btn.disabled { opacity: 0.6; cursor: not-allowed; }
      .ca-main-btn.stop { background: #dc2626; }
      .ca-main-btn.stop:hover { background: #b91c1c; }

      .ca-colors {
        display: none;
        gap: 12px;
        justify-content: center;
        padding: 8px 0;
      }
      .ca-color-btn {
        width: 52px;
        height: 52px;
        border: 2px solid #e5e5e5;
        border-radius: 10px;
        cursor: pointer;
        font-size: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        background: #fff;
      }
      .ca-color-btn:hover { border-color: #2563eb; transform: scale(1.05); }
      .ca-color-btn.white { background: #f8f8f8; }
      .ca-color-btn.black { background: #2a2a2a; color: #fff; }

      .ca-actions {
        display: none;
        gap: 8px;
      }
      .ca-action-btn {
        flex: 1;
        padding: 8px;
        border: 1px solid #e5e5e5;
        border-radius: 6px;
        background: #fff;
        color: #666;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
      }
      .ca-action-btn:hover { border-color: #2563eb; color: #2563eb; }
      .ca-action-btn.active { background: #16a34a; color: #fff; border-color: #16a34a; }

      .ca-status {
        padding: 10px 12px;
        background: #f8f9fa;
        border-radius: 8px;
        font-size: 12px;
        color: #666;
        text-align: center;
      }

      .ca-history {
        max-height: 150px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .ca-move {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: #f8f9fa;
        border-radius: 6px;
        opacity: 0.6;
        transition: opacity 0.2s;
      }
      .ca-move.latest { opacity: 1; background: #f0f4ff; }
      .ca-move-name {
        font-weight: 600;
        font-family: 'SF Mono', Monaco, monospace;
        min-width: 50px;
      }
      .ca-move-score {
        color: #888;
        font-size: 11px;
        min-width: 40px;
      }
      .ca-move-rating {
        margin-left: auto;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .ca-move-rating.excellent { background: #dcfce7; color: #16a34a; }
      .ca-move-rating.good { background: #dbeafe; color: #2563eb; }
      .ca-move-rating.ok { background: #fef3c7; color: #d97706; }
      .ca-move-rating.poor { background: #fee2e2; color: #dc2626; }

      .ca-empty {
        text-align: center;
        color: #999;
        padding: 16px;
        font-size: 12px;
      }

      #${PANEL_ID}.ca-collapsed { width: auto !important; box-shadow: none !important; background: transparent !important; border-radius: 4px; }
      #${PANEL_ID}.ca-collapsed .ca-body { display: none; }
      #${PANEL_ID}.ca-collapsed .ca-header { display: none; }

      .ca-mini {
        display: none;
        width: 20px;
        height: 20px;
        align-items: center;
        justify-content: center;
        cursor: grab;
        opacity: 0.5;
        transition: opacity 0.2s;
        font-size: 14px;
        font-weight: bold;
        color: #666;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      }
      .ca-mini:hover { opacity: 0.8; }
      .ca-mini:active { cursor: grabbing; }
      #${PANEL_ID}.ca-collapsed .ca-mini { display: flex; }
    `;
    document.head.appendChild(style);
  }

  private createPanel(): HTMLElement {
    const panel = createElement('div', {});
    panel.id = PANEL_ID;

    panel.innerHTML = `
      <div class="ca-mini" id="ca-mini" title="Expand">+</div>
      <div class="ca-header" id="ca-header">
        <span class="ca-title">Chess Assistant</span>
        <button class="ca-header-btn" id="ca-collapse" title="Minimize">−</button>
      </div>
      <div class="ca-body">
        <div class="ca-bar-container">
          <span class="ca-score-label" id="ca-score-label">0.0</span>
          <div class="ca-bar">
            <div class="ca-bar-fill" id="ca-bar-fill"></div>
          </div>
        </div>

        <button class="ca-main-btn" id="ca-main-btn">Start</button>

        <div class="ca-colors" id="ca-colors">
          <button class="ca-color-btn white" data-color="w">♔</button>
          <button class="ca-color-btn black" data-color="b">♚</button>
        </div>

        <div class="ca-actions" id="ca-actions">
          <button class="ca-action-btn" id="ca-auto-btn">Auto</button>
          <button class="ca-action-btn" id="ca-switch-btn">Switch</button>
        </div>

        <div class="ca-status" id="ca-status">Click Start to begin analysis</div>

        <div class="ca-history" id="ca-history">
          <div class="ca-empty">No moves analyzed yet</div>
        </div>
      </div>
    `;

    this.attachEventListeners(panel);
    return panel;
  }

  private attachEventListeners(panel: HTMLElement): void {
    // Collapse
    panel.querySelector('#ca-collapse')?.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.add('ca-collapsed');
    });

    // Expand from mini (only if not dragged)
    panel.querySelector('#ca-mini')?.addEventListener('click', () => {
      if (!this.hasDragged) {
        panel.classList.remove('ca-collapsed');
      }
    });

    // Main button
    panel.querySelector('#ca-main-btn')?.addEventListener('click', () => {
      const btn = panel.querySelector('#ca-main-btn') as HTMLElement;
      if (btn?.classList.contains('stop')) {
        this.callbacks.onDeactivate();
      } else if (!btn?.classList.contains('disabled')) {
        this.callbacks.onActivate();
      }
    });

    // Color selection
    panel.querySelectorAll('.ca-color-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = (btn as HTMLElement).dataset.color as PlayerColor;
        this.callbacks.onColorSelect(color);
      });
    });

    // Auto play
    panel.querySelector('#ca-auto-btn')?.addEventListener('click', () => {
      this.isAutoPlayActive = !this.isAutoPlayActive;
      const btn = panel.querySelector('#ca-auto-btn') as HTMLElement;
      if (btn) {
        btn.classList.toggle('active', this.isAutoPlayActive);
        btn.textContent = this.isAutoPlayActive ? 'Stop Auto' : 'Auto';
      }
      this.callbacks.onAutoPlayToggle(this.isAutoPlayActive);
    });

    // Switch color
    panel.querySelector('#ca-switch-btn')?.addEventListener('click', () => {
      this.callbacks.onDeactivate();
      this.showColorSelection();
    });
  }

  private setupDragListeners(): void {
    const header = document.getElementById('ca-header');
    const mini = document.getElementById('ca-mini');
    if (!this.panel) return;

    const startDrag = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      this.isDragging = true;
      this.hasDragged = false;
      const rect = this.panel!.getBoundingClientRect();
      this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.panel!.style.transition = 'none';
      e.preventDefault();
    };

    header?.addEventListener('mousedown', startDrag);
    mini?.addEventListener('mousedown', startDrag);

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging || !this.panel) return;
      this.hasDragged = true;
      const x = Math.max(0, Math.min(window.innerWidth - this.panel.offsetWidth, e.clientX - this.dragOffset.x));
      const y = Math.max(0, Math.min(window.innerHeight - this.panel.offsetHeight, e.clientY - this.dragOffset.y));
      this.panel.style.left = `${x}px`;
      this.panel.style.top = `${y}px`;
      this.panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging && this.panel) {
        this.isDragging = false;
        this.panel.style.transition = '';
      }
    });
  }
}
