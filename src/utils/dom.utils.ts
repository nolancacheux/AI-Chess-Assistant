/**
 * DOM Utilities - Helper functions for DOM manipulation
 */

/**
 * Create an HTML element with styles
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  styles?: Partial<CSSStyleDeclaration>,
  attributes?: Record<string, string>
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (styles) {
    Object.assign(element.style, styles);
  }

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  return element;
}

/**
 * Create a mouse event for simulation
 */
export function createMouseEvent(
  type: string,
  x: number,
  y: number,
  button: number = 0
): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    button,
    buttons: type === 'mousedown' ? 1 : 0,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    detail: 1,
  });
}

/**
 * Create a pointer event for simulation
 */
export function createPointerEvent(
  type: string,
  x: number,
  y: number,
  button: number = 0
): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    button,
    buttons: type === 'pointerdown' ? 1 : 0,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    pointerId: 1,
    width: 1,
    height: 1,
    pressure: 0.5,
    isPrimary: true,
    pointerType: 'mouse',
  });
}

/**
 * Dispatch a full click sequence on an element
 */
export function dispatchClickSequence(
  element: Element,
  x: number,
  y: number
): void {
  element.dispatchEvent(createPointerEvent('pointerdown', x, y));
  element.dispatchEvent(createMouseEvent('mousedown', x, y));
  element.dispatchEvent(createPointerEvent('pointerup', x, y));
  element.dispatchEvent(createMouseEvent('mouseup', x, y));
  element.dispatchEvent(createPointerEvent('click', x, y));
  element.dispatchEvent(createMouseEvent('click', x, y));
}

/**
 * Create a visual click indicator (for debugging)
 */
export function createClickIndicator(
  x: number,
  y: number,
  color: string
): void {
  const indicator = createElement('div', {
    position: 'fixed',
    width: '15px',
    height: '15px',
    background: color,
    borderRadius: '50%',
    opacity: '0.6',
    pointerEvents: 'none',
    zIndex: '9999',
    transform: 'translate(-50%, -50%)',
    transition: 'opacity 0.5s',
    boxShadow: `0 0 8px ${color}`,
    left: `${x}px`,
    top: `${y}px`,
  });

  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 500);
  }, 800);
}

/**
 * Add CSS keyframes animation to document
 */
export function addKeyframesAnimation(name: string, keyframes: string): void {
  const existingStyle = document.getElementById(`keyframes-${name}`);
  if (existingStyle) return;

  const style = document.createElement('style');
  style.id = `keyframes-${name}`;
  style.textContent = `@keyframes ${name} { ${keyframes} }`;
  document.head.appendChild(style);
}
