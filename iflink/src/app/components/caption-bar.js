/**
 * 字幕条：显示 FeedbackService 发来的同步字幕。
 *
 * 为什么单独一个单例：路由重绘会把旧 DOM 丢掉，如果每次渲染都新建字幕条，
 * 订阅会越堆越多。单例只订阅一次，每次渲染把同一个 root 重新挂上去即可。
 *
 * 依据 PRD §11「所有语音都有文字字幕」与合同 §5.1「语音不可用时字幕仍要出现」。
 * 静音只停声音，字幕照常显示。
 */

import { el } from './dom.js';
import { getMockFeedback } from '../mocks/mock-feedback-service.js';

/**
 * @returns {{root: HTMLElement, dispose: () => void, current: () => string}}
 */
export function getCaptionBar() {
  if (captionBar) return captionBar;

  const textNode = el('span', { className: 'captionbar__text', text: '' });
  const root = el(
    'div',
    {
      className: 'captionbar',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
    },
    [el('span', { className: 'captionbar__label', text: '字幕' }), textNode],
  );
  root.hidden = true;

  let text = '';

  const unsubscribe = getMockFeedback().onCaption((value) => {
    text = typeof value === 'string' ? value : '';
    textNode.textContent = text;
    root.hidden = text === '';
  });

  captionBar = {
    root,
    current: () => text,
    dispose() {
      unsubscribe();
      captionBar = null;
    },
  };

  return captionBar;
}

/** @type {ReturnType<typeof getCaptionBar> | null} */
let captionBar = null;

/** 销毁单例（测试用）。 */
export function resetCaptionBar() {
  if (captionBar) {
    captionBar.dispose();
    captionBar = null;
  }
}
