/**
 * Panel Component - Modern UI panel for the chess assistant
 */

import type { AnalysisEntry, ColorSelectionCallback, PlayerColor, Score } from '@/types';
import type { MLEvaluation } from '@/services/evaluation.service';
import type { OpeningInfo } from '@/services/openingbook.service';
import type { PatternAnalysis } from '@/services/patterns.service';
import { DEFAULT_THEME } from '@/types';
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
 * Chess Assistant Panel - Modern Design
 */
export class PanelComponent {
  private panel: HTMLElement | null = null;
  private callbacks: PanelCallbacks;
  private isCollapsed = false;
  private isAutoPlayActive = false;

  constructor(callbacks: PanelCallbacks) {
    this.callbacks = callbacks;
  }

  public create(): void {
    if (document.getElementById(PANEL_ID)) return;
    this.injectStyles();
    this.panel = this.createPanel();
    document.body.appendChild(this.panel);
  }

  public destroy(): void {
    this.panel?.remove();
    this.panel = null;
  }

  public updateStatus(text: string): void {
    const statusElement = document.getElementById('ca-status');
    if (statusElement) {
      statusElement.textContent = this.isAutoPlayActive ? `${text} (Auto)` : text;
    }
  }

  public showColorSelection(): void {
    const container = document.getElementById('ca-color-selection');
    const controlButton = document.getElementById('ca-control-btn');
    if (container) container.style.display = 'flex';
    if (controlButton) {
      controlButton.textContent = 'Select Color';
      (controlButton as HTMLButtonElement).disabled = true;
      controlButton.classList.add('disabled');
    }
  }

  public showActiveState(): void {
    const container = document.getElementById('ca-color-selection');
    const controlButton = document.getElementById('ca-control-btn');
    const secondaryBtns = document.getElementById('ca-secondary-btns');

    if (container) container.style.display = 'none';
    if (controlButton) {
      controlButton.textContent = 'Stop';
      (controlButton as HTMLButtonElement).disabled = false;
      controlButton.classList.remove('disabled');
      controlButton.classList.add('active');
    }
    if (secondaryBtns) secondaryBtns.style.display = 'flex';
  }

  public showInactiveState(): void {
    const container = document.getElementById('ca-color-selection');
    const controlButton = document.getElementById('ca-control-btn');
    const secondaryBtns = document.getElementById('ca-secondary-btns');

    if (container) container.style.display = 'none';
    if (controlButton) {
      controlButton.textContent = 'Start';
      (controlButton as HTMLButtonElement).disabled = false;
      controlButton.classList.remove('disabled', 'active');
    }
    if (secondaryBtns) secondaryBtns.style.display = 'none';
    this.isAutoPlayActive = false;
  }

  public updateHistory(history: AnalysisEntry[]): void {
    const historyPanel = document.getElementById('ca-history');
    if (!historyPanel) return;

    const sorted = [...history].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (sorted.length === 0) {
      historyPanel.innerHTML = '<div class="ca-empty">No analysis yet</div>';
      return;
    }

    historyPanel.innerHTML = sorted
      .slice(0, 5)
      .map(
        (entry, i) => `
        <div class="ca-history-item ${i === 0 ? 'latest' : ''}">
          <span class="ca-move">${entry.move || '-'}</span>
          <span class="ca-score">${entry.score ?? '-'}</span>
          <span class="ca-rating ${getMoveRating(entry.score).toLowerCase()}">${getMoveRating(entry.score)}</span>
          <span class="ca-depth">D${entry.depth || '-'}</span>
        </div>
      `
      )
      .join('');
  }

  public updateOpeningInfo(info: OpeningInfo): void {
    const el = document.getElementById('ca-opening');
    if (!el) return;

    if (!info.isInBook && !info.name) {
      el.style.display = 'none';
      return;
    }

    el.style.display = 'block';
    const eco = info.eco ? `<span class="ca-eco">${info.eco}</span>` : '';
    const bookMoves = info.bookMoves.length > 0
      ? `<div class="ca-book-moves">${info.bookMoves.slice(0, 3).map(m =>
          `<span class="ca-book-move">${m.move} <small>${(m.winRate * 100).toFixed(0)}%</small></span>`
        ).join('')}</div>`
      : '';

    el.innerHTML = `
      <div class="ca-opening-header">${eco}${info.name || 'Unknown'}</div>
      ${info.description ? `<div class="ca-opening-desc">${info.description}</div>` : ''}
      ${bookMoves}
    `;
  }

  public updatePatternInfo(analysis: PatternAnalysis): void {
    const el = document.getElementById('ca-patterns');
    if (!el) return;

    if (analysis.patterns.length === 0) {
      el.style.display = 'none';
      return;
    }

    el.style.display = 'block';
    const icons: Record<string, string> = { tactical: '⚔', positional: '◎', structural: '▦' };
    const colors: Record<string, string> = { critical: '#ef4444', important: '#f59e0b', minor: '#6366f1' };

    el.innerHTML = `
      <div class="ca-section-header">
        <span>Patterns</span>
        <span class="ca-eval ${analysis.evaluation >= 0 ? 'positive' : 'negative'}">
          ${analysis.evaluation >= 0 ? '+' : ''}${analysis.evaluation.toFixed(2)}
        </span>
      </div>
      <div class="ca-patterns-list">
        ${analysis.patterns.slice(0, 4).map(p => `
          <div class="ca-pattern" style="border-left-color: ${colors[p.severity]}">
            <span class="ca-pattern-icon">${icons[p.category]}</span>
            <span class="ca-pattern-name">${p.name}</span>
            ${p.squares?.length ? `<span class="ca-pattern-squares">${p.squares.slice(0, 2).join(',')}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  public updateMLEvaluation(evaluation: MLEvaluation): void {
    const el = document.getElementById('ca-ml');
    if (!el) return;

    el.style.display = 'block';
    const winPct = (evaluation.winProbability * 100).toFixed(0);
    const confPct = (evaluation.confidence * 100).toFixed(0);

    el.innerHTML = `
      <div class="ca-section-header">
        <span>Win Probability</span>
        <span class="ca-confidence">${confPct}% conf</span>
      </div>
      <div class="ca-win-bar">
        <div class="ca-win-fill" style="width: ${winPct}%"></div>
        <span class="ca-win-label">${winPct}%</span>
      </div>
      <div class="ca-features">
        ${evaluation.featureImportance.slice(0, 3).map(f => `
          <div class="ca-feature">
            <span class="ca-feature-name">${f.name}</span>
            <div class="ca-feature-bar">
              <div class="ca-feature-fill ${f.impact >= 0 ? 'positive' : 'negative'}"
                   style="width: ${Math.min(100, Math.abs(f.impact) * 50)}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  public updateAdvantage(score: Score | null): void {
    const bar = document.getElementById('ca-adv-bar');
    const label = document.getElementById('ca-adv-label');
    if (!bar || !label) return;

    const pct = scoreToPercentage(score);
    bar.style.width = `${pct}%`;

    if (score !== null) {
      const display = score >= 0 ? `+${(score / 100).toFixed(1)}` : (score / 100).toFixed(1);
      label.textContent = display;
      label.className = `ca-adv-label ${score >= 0 ? 'positive' : 'negative'}`;
    }
  }

  private injectStyles(): void {
    if (document.getElementById('ca-styles')) return;

    const style = document.createElement('style');
    style.id = 'ca-styles';
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        right: 16px;
        top: 16px;
        width: 320px;
        background: ${DEFAULT_THEME.background};
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${DEFAULT_THEME.border};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        color: ${DEFAULT_THEME.text};
        z-index: 10000;
        overflow: hidden;
      }
      #${PANEL_ID} * { box-sizing: border-box; }

      .ca-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: ${DEFAULT_THEME.surface};
        border-bottom: 1px solid ${DEFAULT_THEME.border};
      }
      .ca-logo {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
      }
      .ca-logo-icon {
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, ${DEFAULT_THEME.primary}, ${DEFAULT_THEME.accent});
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      .ca-collapse-btn {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: ${DEFAULT_THEME.textMuted};
        cursor: pointer;
        border-radius: 6px;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .ca-collapse-btn:hover {
        background: ${DEFAULT_THEME.border};
        color: ${DEFAULT_THEME.text};
      }

      .ca-content {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ca-control-btn {
        width: 100%;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        background: ${DEFAULT_THEME.primary};
        color: white;
      }
      .ca-control-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      .ca-control-btn.disabled { opacity: 0.5; cursor: not-allowed; }
      .ca-control-btn.active { background: ${DEFAULT_THEME.error}; }

      .ca-color-selection {
        display: none;
        gap: 12px;
        justify-content: center;
        padding: 8px 0;
      }
      .ca-color-btn {
        width: 56px;
        height: 56px;
        border: 2px solid ${DEFAULT_THEME.border};
        border-radius: 12px;
        cursor: pointer;
        font-size: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        background: ${DEFAULT_THEME.surface};
      }
      .ca-color-btn:hover {
        border-color: ${DEFAULT_THEME.primary};
        transform: scale(1.05);
      }
      .ca-color-btn.white { background: #f0f0f0; color: #1a1a1a; }
      .ca-color-btn.black { background: #1a1a1a; color: #f0f0f0; }

      .ca-secondary-btns {
        display: none;
        gap: 8px;
      }
      .ca-secondary-btn {
        flex: 1;
        padding: 8px;
        border: 1px solid ${DEFAULT_THEME.border};
        border-radius: 6px;
        background: transparent;
        color: ${DEFAULT_THEME.textMuted};
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .ca-secondary-btn:hover {
        background: ${DEFAULT_THEME.surface};
        color: ${DEFAULT_THEME.text};
        border-color: ${DEFAULT_THEME.primary};
      }
      .ca-secondary-btn.active {
        background: ${DEFAULT_THEME.success};
        color: white;
        border-color: ${DEFAULT_THEME.success};
      }

      .ca-status {
        padding: 12px;
        background: ${DEFAULT_THEME.surface};
        border-radius: 8px;
        text-align: center;
        font-weight: 500;
        color: ${DEFAULT_THEME.accent};
      }

      .ca-advantage {
        position: relative;
        height: 8px;
        background: ${DEFAULT_THEME.error};
        border-radius: 4px;
        overflow: visible;
      }
      .ca-adv-bar {
        height: 100%;
        background: ${DEFAULT_THEME.success};
        border-radius: 4px;
        transition: width 0.3s ease;
        width: 50%;
      }
      .ca-adv-label {
        position: absolute;
        top: -20px;
        right: 0;
        font-size: 11px;
        font-weight: 600;
      }
      .ca-adv-label.positive { color: ${DEFAULT_THEME.success}; }
      .ca-adv-label.negative { color: ${DEFAULT_THEME.error}; }

      .ca-section {
        display: none;
        background: ${DEFAULT_THEME.surface};
        border-radius: 8px;
        padding: 10px 12px;
      }
      .ca-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: ${DEFAULT_THEME.textMuted};
        margin-bottom: 8px;
      }

      .ca-opening-header { font-weight: 600; color: ${DEFAULT_THEME.text}; }
      .ca-eco {
        display: inline-block;
        background: ${DEFAULT_THEME.primary};
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        margin-right: 6px;
      }
      .ca-opening-desc { font-size: 11px; color: ${DEFAULT_THEME.textMuted}; margin-top: 4px; }
      .ca-book-moves { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
      .ca-book-move {
        background: ${DEFAULT_THEME.background};
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
      }
      .ca-book-move small { color: ${DEFAULT_THEME.success}; margin-left: 4px; }

      .ca-patterns-list { display: flex; flex-direction: column; gap: 4px; }
      .ca-pattern {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: ${DEFAULT_THEME.background};
        border-radius: 4px;
        border-left: 3px solid;
        font-size: 12px;
      }
      .ca-pattern-icon { opacity: 0.7; }
      .ca-pattern-name { flex: 1; }
      .ca-pattern-squares { color: ${DEFAULT_THEME.textMuted}; font-size: 10px; }
      .ca-eval { font-weight: 600; font-size: 12px; }
      .ca-eval.positive { color: ${DEFAULT_THEME.success}; }
      .ca-eval.negative { color: ${DEFAULT_THEME.error}; }

      .ca-win-bar {
        position: relative;
        height: 24px;
        background: ${DEFAULT_THEME.error};
        border-radius: 6px;
        overflow: hidden;
      }
      .ca-win-fill {
        height: 100%;
        background: ${DEFAULT_THEME.success};
        transition: width 0.3s;
      }
      .ca-win-label {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }
      .ca-confidence { font-size: 10px; color: ${DEFAULT_THEME.textMuted}; }
      .ca-features { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
      .ca-feature { display: flex; align-items: center; gap: 8px; font-size: 11px; }
      .ca-feature-name { width: 80px; color: ${DEFAULT_THEME.textMuted}; }
      .ca-feature-bar {
        flex: 1;
        height: 4px;
        background: ${DEFAULT_THEME.background};
        border-radius: 2px;
        overflow: hidden;
      }
      .ca-feature-fill { height: 100%; border-radius: 2px; }
      .ca-feature-fill.positive { background: ${DEFAULT_THEME.success}; }
      .ca-feature-fill.negative { background: ${DEFAULT_THEME.error}; }

      .ca-history { max-height: 140px; overflow-y: auto; }
      .ca-history-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid ${DEFAULT_THEME.border};
        opacity: 0.6;
      }
      .ca-history-item.latest { opacity: 1; }
      .ca-history-item:last-child { border-bottom: none; }
      .ca-move { font-weight: 600; font-family: monospace; min-width: 50px; }
      .ca-score { color: ${DEFAULT_THEME.textMuted}; min-width: 40px; }
      .ca-rating {
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
      }
      .ca-rating.excellent { background: ${DEFAULT_THEME.success}; color: white; }
      .ca-rating.good { background: #22d3ee; color: #0f172a; }
      .ca-rating.ok { background: ${DEFAULT_THEME.warning}; color: #0f172a; }
      .ca-rating.poor { background: ${DEFAULT_THEME.error}; color: white; }
      .ca-depth { color: ${DEFAULT_THEME.textMuted}; font-size: 11px; margin-left: auto; }
      .ca-empty { text-align: center; color: ${DEFAULT_THEME.textMuted}; padding: 12px; }
    `;
    document.head.appendChild(style);
  }

  private createPanel(): HTMLElement {
    const panel = createElement('div', {});
    panel.id = PANEL_ID;

    panel.innerHTML = `
      <div class="ca-header">
        <div class="ca-logo">
          <div class="ca-logo-icon">♔</div>
          <span>Chess AI</span>
        </div>
        <button class="ca-collapse-btn" id="ca-collapse">−</button>
      </div>
      <div class="ca-content" id="ca-content">
        <button class="ca-control-btn" id="ca-control-btn">Start</button>

        <div class="ca-color-selection" id="ca-color-selection">
          <button class="ca-color-btn white" data-color="w">♔</button>
          <button class="ca-color-btn black" data-color="b">♚</button>
        </div>

        <div class="ca-secondary-btns" id="ca-secondary-btns">
          <button class="ca-secondary-btn" id="ca-autoplay-btn">Auto Play</button>
          <button class="ca-secondary-btn" id="ca-change-color-btn">Change Color</button>
        </div>

        <div class="ca-status" id="ca-status">Click Start to begin</div>

        <div class="ca-advantage">
          <div class="ca-adv-bar" id="ca-adv-bar"></div>
          <span class="ca-adv-label" id="ca-adv-label">0.0</span>
        </div>

        <div class="ca-section" id="ca-opening"></div>
        <div class="ca-section" id="ca-patterns"></div>
        <div class="ca-section" id="ca-ml"></div>

        <div class="ca-section" id="ca-history-section" style="display: block;">
          <div class="ca-section-header">Analysis History</div>
          <div class="ca-history" id="ca-history">
            <div class="ca-empty">No analysis yet</div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(panel);
    return panel;
  }

  private attachEventListeners(panel: HTMLElement): void {
    // Collapse button
    panel.querySelector('#ca-collapse')?.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      const content = panel.querySelector('#ca-content') as HTMLElement;
      const btn = panel.querySelector('#ca-collapse') as HTMLElement;
      if (content) content.style.display = this.isCollapsed ? 'none' : 'flex';
      if (btn) btn.textContent = this.isCollapsed ? '+' : '−';
    });

    // Control button
    panel.querySelector('#ca-control-btn')?.addEventListener('click', () => {
      this.callbacks.onActivate();
    });

    // Color selection
    panel.querySelectorAll('.ca-color-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = (btn as HTMLElement).dataset.color as PlayerColor;
        this.callbacks.onColorSelect(color);
      });
    });

    // Auto play button
    panel.querySelector('#ca-autoplay-btn')?.addEventListener('click', () => {
      this.isAutoPlayActive = !this.isAutoPlayActive;
      const btn = panel.querySelector('#ca-autoplay-btn') as HTMLElement;
      if (btn) {
        btn.classList.toggle('active', this.isAutoPlayActive);
        btn.textContent = this.isAutoPlayActive ? 'Stop Auto' : 'Auto Play';
      }
      this.callbacks.onAutoPlayToggle(this.isAutoPlayActive);
    });

    // Change color button
    panel.querySelector('#ca-change-color-btn')?.addEventListener('click', () => {
      this.callbacks.onDeactivate();
      this.showColorSelection();
    });
  }
}
