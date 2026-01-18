/**
 * Panel Component - Main UI panel for the chess assistant
 */

import type { AnalysisEntry, ColorSelectionCallback, PlayerColor, Score } from '@/types';
import type { OpeningInfo } from '@/services/openingbook.service';
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
 * Chess Assistant Panel
 */
export class PanelComponent {
  private panel: HTMLElement | null = null;
  private callbacks: PanelCallbacks;
  private isCollapsed = false;
  private isAutoPlayActive = false;

  constructor(callbacks: PanelCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Create and mount the panel
   */
  public create(): void {
    if (document.getElementById(PANEL_ID)) return;

    this.panel = this.createPanel();
    document.body.appendChild(this.panel);
  }

  /**
   * Remove the panel from DOM
   */
  public destroy(): void {
    this.panel?.remove();
    this.panel = null;
  }

  /**
   * Update status text
   */
  public updateStatus(text: string): void {
    const statusElement = document.getElementById('assistant-status');
    if (statusElement) {
      statusElement.textContent = this.isAutoPlayActive ? `${text} (Auto-play active)` : text;
    }
  }

  /**
   * Show color selection
   */
  public showColorSelection(): void {
    const container = document.getElementById('color-choice-container');
    const controlButton = document.getElementById('assistant-control-button');

    if (container) container.style.display = 'flex';
    if (controlButton) {
      controlButton.textContent = 'Choose your color';
      (controlButton as HTMLButtonElement).disabled = true;
    }
  }

  /**
   * Hide color selection and show active state
   */
  public showActiveState(): void {
    const container = document.getElementById('color-choice-container');
    const controlButton = document.getElementById('assistant-control-button');
    const changeColorButton = document.getElementById('change-color-button');
    const autoPlayButton = document.getElementById('auto-play-button');

    if (container) container.style.display = 'none';
    if (controlButton) {
      controlButton.textContent = 'Deactivate';
      (controlButton as HTMLButtonElement).disabled = false;
    }
    if (changeColorButton) changeColorButton.style.display = 'block';
    if (autoPlayButton) autoPlayButton.style.display = 'block';
  }

  /**
   * Show inactive state
   */
  public showInactiveState(): void {
    const container = document.getElementById('color-choice-container');
    const controlButton = document.getElementById('assistant-control-button');
    const changeColorButton = document.getElementById('change-color-button');
    const autoPlayButton = document.getElementById('auto-play-button');

    if (container) container.style.display = 'none';
    if (controlButton) {
      controlButton.textContent = 'Activate';
      (controlButton as HTMLButtonElement).disabled = false;
    }
    if (changeColorButton) changeColorButton.style.display = 'none';
    if (autoPlayButton) autoPlayButton.style.display = 'none';

    this.isAutoPlayActive = false;
  }

  /**
   * Update analysis history display
   */
  public updateHistory(history: AnalysisEntry[]): void {
    const historyPanel = document.getElementById('analysis-history');
    if (!historyPanel) return;

    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    historyPanel.innerHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: ${DEFAULT_THEME.primary}; color: white;">
            <th style="padding: 8px; text-align: left;">Time</th>
            <th style="padding: 8px; text-align: left;">Move</th>
            <th style="padding: 8px; text-align: left;">Score</th>
            <th style="padding: 8px; text-align: left;">Rating</th>
            <th style="padding: 8px; text-align: left;">Depth</th>
          </tr>
        </thead>
        <tbody>
          ${sortedHistory
            .map(
              (entry, index) => `
            <tr class="history-entry ${entry.isFinal ? 'final-move' : ''}"
                style="border-bottom: 1px solid ${DEFAULT_THEME.border}; opacity: ${index === 0 ? 1 : 0.6};">
              <td style="padding: 8px;">${new Date(entry.timestamp).toLocaleTimeString()}</td>
              <td style="padding: 8px;">${entry.move || '-'}</td>
              <td style="padding: 8px;">${entry.score ?? '-'}</td>
              <td style="padding: 8px;">${getMoveRating(entry.score)}</td>
              <td style="padding: 8px;">${entry.depth || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Update opening information display
   */
  public updateOpeningInfo(info: OpeningInfo): void {
    const openingElement = document.getElementById('opening-info');
    if (!openingElement) return;

    if (!info.isInBook && !info.name) {
      openingElement.style.display = 'none';
      return;
    }

    openingElement.style.display = 'block';

    const ecoDisplay = info.eco ? `<span style="color: ${DEFAULT_THEME.accent}; font-weight: bold;">[${info.eco}]</span> ` : '';
    const nameDisplay = info.name || 'Unknown Opening';
    const descDisplay = info.description ? `<div style="font-size: 0.85em; color: ${DEFAULT_THEME.textMuted}; margin-top: 4px;">${info.description}</div>` : '';

    let bookMovesHtml = '';
    if (info.bookMoves.length > 0) {
      bookMovesHtml = `
        <div style="margin-top: 8px; font-size: 0.9em;">
          <strong>Book moves:</strong>
          ${info.bookMoves
            .slice(0, 3)
            .map(
              (m) =>
                `<span style="display: inline-block; margin: 2px 4px; padding: 2px 6px; background: ${DEFAULT_THEME.surface}; border-radius: 3px;">
                  ${m.move} <span style="color: ${DEFAULT_THEME.success};">${(m.winRate * 100).toFixed(0)}%</span>
                </span>`
            )
            .join('')}
        </div>
      `;
    }

    openingElement.innerHTML = `
      <div style="font-size: 1.1em;">${ecoDisplay}${nameDisplay}</div>
      ${descDisplay}
      ${bookMovesHtml}
    `;
  }

  /**
   * Update advantage indicator
   */
  public updateAdvantage(score: Score | null): void {
    const bar = document.getElementById('advantage-bar');
    const marker = document.getElementById('advantage-marker');
    if (!bar || !marker) return;

    const percentage = scoreToPercentage(score);

    if (percentage > 50) {
      bar.style.width = `${percentage}%`;
      bar.style.left = '0';
    } else {
      bar.style.width = `${100 - percentage}%`;
      bar.style.left = `${percentage}%`;
    }

    marker.style.left = `${percentage}%`;
  }

  /**
   * Create the main panel element
   */
  private createPanel(): HTMLElement {
    const panel = createElement('div', {
      position: 'fixed',
      right: '20px',
      top: '20px',
      width: '400px',
      background: DEFAULT_THEME.background,
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '20px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      zIndex: '1000',
      transition: 'all 0.3s ease',
    });
    panel.id = PANEL_ID;

    panel.appendChild(this.createHeader());
    panel.appendChild(this.createContent());

    return panel;
  }

  /**
   * Create header section
   */
  private createHeader(): HTMLElement {
    const header = createElement('div', {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: `1px solid ${DEFAULT_THEME.border}`,
      position: 'relative',
    });

    // Title
    const title = createElement('h3', {
      margin: '0',
      color: DEFAULT_THEME.primary,
      fontSize: '1.4em',
    });
    title.textContent = 'AI Chess Assistant';

    // Control button
    const controlButton = this.createButton('Activate', () => {
      this.callbacks.onActivate();
    });
    controlButton.id = 'assistant-control-button';

    // Collapse button
    const collapseButton = this.createCollapseButton();

    header.appendChild(title);
    header.appendChild(controlButton);
    header.appendChild(collapseButton);

    return header;
  }

  /**
   * Create content section
   */
  private createContent(): HTMLElement {
    const content = createElement('div', {
      transition: 'all 0.3s ease',
    });
    content.id = 'assistant-content';

    content.appendChild(this.createColorSelection());
    content.appendChild(this.createOpeningInfoDisplay());
    content.appendChild(this.createAdvantageIndicator());
    content.appendChild(this.createStatusDisplay());
    content.appendChild(this.createAutoPlayButton());
    content.appendChild(this.createHistoryPanel());
    content.appendChild(this.createChangeColorButton());

    return content;
  }

  /**
   * Create color selection buttons
   */
  private createColorSelection(): HTMLElement {
    const container = createElement('div', {
      display: 'none',
      gap: '15px',
      margin: '20px 0',
      justifyContent: 'center',
    });
    container.id = 'color-choice-container';

    const whiteButton = this.createColorButton('&#9812;', 'w');
    const blackButton = this.createColorButton('&#9818;', 'b');

    container.appendChild(whiteButton);
    container.appendChild(blackButton);

    return container;
  }

  /**
   * Create color selection button
   */
  private createColorButton(symbol: string, color: PlayerColor): HTMLElement {
    const isWhite = color === 'w';
    const button = createElement('button', {
      background: isWhite ? '#ecf0f1' : DEFAULT_THEME.primary,
      color: isWhite ? DEFAULT_THEME.primary : 'white',
      border: `2px solid ${isWhite ? '#bdc3c7' : DEFAULT_THEME.secondary}`,
      padding: '15px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '2em',
      width: '70px',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    });

    button.innerHTML = symbol;
    button.onmouseover = (): void => {
      button.style.transform = 'scale(1.05)';
    };
    button.onmouseout = (): void => {
      button.style.transform = 'scale(1)';
    };
    button.onclick = (): void => {
      this.callbacks.onColorSelect(color);
    };

    return button;
  }

  /**
   * Create opening info display
   */
  private createOpeningInfoDisplay(): HTMLElement {
    const container = createElement('div', {
      display: 'none',
      margin: '10px 0',
      padding: '12px',
      background: `linear-gradient(135deg, ${DEFAULT_THEME.surface} 0%, #e8f4f8 100%)`,
      borderRadius: '6px',
      borderLeft: `4px solid ${DEFAULT_THEME.accent}`,
    });
    container.id = 'opening-info';

    return container;
  }

  /**
   * Create advantage indicator
   */
  private createAdvantageIndicator(): HTMLElement {
    const container = createElement('div', {
      height: '20px',
      background: DEFAULT_THEME.primary,
      border: '2px solid #ffffff',
      borderRadius: '10px',
      margin: '15px 0',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 0 0 2px ${DEFAULT_THEME.primary}`,
    });
    container.id = 'advantage-indicator';

    const bar = createElement('div', {
      position: 'absolute',
      height: '100%',
      width: '50%',
      background: '#ffffff',
      left: '0',
      transition: 'width 0.3s ease, left 0.3s ease',
      borderRadius: '8px',
    });
    bar.id = 'advantage-bar';

    const marker = createElement('div', {
      position: 'absolute',
      width: '4px',
      height: '100%',
      background: DEFAULT_THEME.accent,
      left: '50%',
      transform: 'translateX(-50%)',
      transition: 'left 0.3s ease',
    });
    marker.id = 'advantage-marker';

    container.appendChild(bar);
    container.appendChild(marker);

    return container;
  }

  /**
   * Create status display
   */
  private createStatusDisplay(): HTMLElement {
    const status = createElement('div', {
      margin: '15px 0',
      padding: '15px',
      background: DEFAULT_THEME.surface,
      borderRadius: '4px',
      fontSize: '1.1em',
      color: DEFAULT_THEME.text,
    });
    status.id = 'assistant-status';

    return status;
  }

  /**
   * Create auto-play button
   */
  private createAutoPlayButton(): HTMLElement {
    const button = this.createButton('Auto Play', () => {
      this.isAutoPlayActive = !this.isAutoPlayActive;
      if (this.isAutoPlayActive) {
        button.style.background = DEFAULT_THEME.success;
        button.textContent = 'Stop Auto Play';
      } else {
        button.style.background = DEFAULT_THEME.primary;
        button.textContent = 'Auto Play';
      }
      this.callbacks.onAutoPlayToggle(this.isAutoPlayActive);
    });
    button.id = 'auto-play-button';
    button.style.display = 'none';
    button.style.marginTop = '15px';

    return button;
  }

  /**
   * Create history panel
   */
  private createHistoryPanel(): HTMLElement {
    const history = createElement('div', {
      maxHeight: '300px',
      overflowY: 'auto',
      marginTop: '20px',
      padding: '15px',
      background: DEFAULT_THEME.surface,
      borderRadius: '4px',
      fontSize: '1.1em',
    });
    history.id = 'analysis-history';

    return history;
  }

  /**
   * Create change color button
   */
  private createChangeColorButton(): HTMLElement {
    const button = this.createButton('Change Color', () => {
      this.callbacks.onDeactivate();
      this.showColorSelection();
    });
    button.id = 'change-color-button';
    button.style.display = 'none';
    button.style.marginTop = '15px';
    button.style.background = '#3498db';

    return button;
  }

  /**
   * Create collapse button
   */
  private createCollapseButton(): HTMLElement {
    const button = createElement('button', {
      background: DEFAULT_THEME.primary,
      color: 'white',
      border: 'none',
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      cursor: 'pointer',
      fontSize: '1.5em',
      lineHeight: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      position: 'absolute',
      left: '50%',
      top: '15px',
      transform: 'translateX(-50%)',
      zIndex: '2',
    });
    button.id = 'collapse-button';
    button.textContent = '−';

    button.onclick = (): void => {
      this.isCollapsed = !this.isCollapsed;
      button.textContent = this.isCollapsed ? '+' : '−';

      const content = document.getElementById('assistant-content');
      if (content && this.panel) {
        content.style.display = this.isCollapsed ? 'none' : 'block';
        this.panel.style.height = this.isCollapsed ? '100px' : 'auto';
      }
    };

    return button;
  }

  /**
   * Create a styled button
   */
  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    Object.assign(button.style, {
      background: DEFAULT_THEME.primary,
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1.1em',
      transition: 'background 0.2s',
    });

    button.textContent = text;
    button.onmouseover = (): void => {
      button.style.background = DEFAULT_THEME.secondary;
    };
    button.onmouseout = (): void => {
      button.style.background = DEFAULT_THEME.primary;
    };
    button.onclick = onClick;

    return button;
  }
}
