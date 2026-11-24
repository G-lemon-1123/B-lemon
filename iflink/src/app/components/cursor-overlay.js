/**
 * 光标图标：把 InputSource 的 `move` 事件画成一个圆环，孩子能看见自己的位置。
 *
 * 依据 PRD §6.1：光标为 48–56px 圆环，捏合时填充/收缩。
 * 本组件只负责「画」，输入逻辑在 InputSource 里（mock 或真实手势模块）。
 *
 * 单例理由同字幕条：避免每次路由重绘都新订阅一次输入源。
 */

import { el } from './dom.js';

/**
 * 取光标覆盖层单例（按输入源区分）。
 *
 * @param {object} input 合同里的 InputSource
 * @returns {{root: HTMLElement, dispose: () => void}}
 */
export function getCursorOverlay(input) {
  if (cursorOverlay && cursorOverlay.input === input) return cursorOverlay;

  const dot = el('div', { className: 'cursor-dot', 'aria-hidden': 'true' });
  const root = el('div', { className: 'cursor-layer', 'aria-hidden': 'true' }, [dot]);
  root.hidden = true;

  const unsubscribe = input.subscribe((event) => {
    if (!event || typeof event.type !== 'string') return;

    if (event.type === 'move' && event.at) {
      root.hidden = false;
      dot.style.left = `${Math.round(event.at.x * 1000) / 10}%`;
      dot.style.top = `${Math.round(event.at.y * 1000) / 10}%`;
      dot.setAttribute('data-grab', event.grab === true ? 'true' : 'false');
      return;
    }

    if (event.type === 'grab-start') {
      dot.setAttribute('data-grab', 'true');
      return;
    }

    if (event.type === 'grab-end') {
      dot.setAttribute('data-grab', 'false');
      return;
    }

    if (event.type === 'status' && (event.status === 'idle' || event.status === 'error')) {
      root.hidden = true;
    }
  });

  cursorOverlay = {
    input,
    root,
    dispose() {
      unsubscribe();
      cursorOverlay = null;
    },
  };

  return cursorOverlay;
}

/** @type {(ReturnType<typeof getCursorOverlay> & {input: object}) | null} */
let cursorOverlay = null;

/** 销毁单例（测试用）。 */
export function resetCursorOverlay() {
  if (cursorOverlay) {
    cursorOverlay.dispose();
    cursorOverlay = null;
  }
}
