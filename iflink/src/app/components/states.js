/**
 * 三种通用页面状态：加载中 / 空 / 出错。
 *
 * AI-GUIDE-02 任务一要求「加载态、空态、错误态组件」。三个状态都做成
 * 同一个视觉骨架（图标位 + 一句话 + 可选动作），保证孩子和家长看到的是
 * 一致的版式，不会每页各长一个样。
 *
 * 文案口径：对孩子说「再试一次」「我们等一等」，不出现「失败」「错误代码」
 * 这类词；技术细节只放在 `detail` 里，默认折叠。
 */

import { el } from './dom.js';

/**
 * @typedef {object} StateAction
 * @property {string} label 按钮文字
 * @property {() => void} onClick
 */

/**
 * 三种状态的共同骨架。
 *
 * @param {object} options
 * @param {string} options.kind 用于 aria-live 与样式：'loading' | 'empty' | 'error'
 * @param {string} options.title 主文案（给孩子的）
 * @param {string} [options.hint] 次级说明
 * @param {StateAction} [options.action] 主要动作
 * @param {StateAction} [options.secondaryAction] 次要动作
 * @param {string} [options.detail] 技术细节，折叠显示
 * @returns {HTMLElement}
 */
function createState(options) {
  const children = [
    // 装饰用图形：对读屏隐藏，纯视觉。
    el('div', { className: `state__art state__art--${options.kind}`, 'aria-hidden': 'true' }),
    el('p', { className: 'state__title', text: options.title }),
    options.hint ? el('p', { className: 'state__hint', text: options.hint }) : null,
  ];

  if (options.action !== undefined || options.secondaryAction !== undefined) {
    children.push(
      el('div', { className: 'state__actions' }, [
        options.action
          ? el('button', {
              className: 'btn btn--primary btn--large',
              type: 'button',
              text: options.action.label,
              onClick: options.action.onClick,
            })
          : null,
        options.secondaryAction
          ? el('button', {
              className: 'btn btn--ghost btn--large',
              type: 'button',
              text: options.secondaryAction.label,
              onClick: options.secondaryAction.onClick,
            })
          : null,
      ]),
    );
  }

  if (options.detail !== undefined && options.detail.length > 0) {
    children.push(
      el('details', { className: 'state__detail' }, [
        el('summary', { text: '技术细节' }),
        el('pre', { className: 'state__detail-text', text: options.detail }),
      ]),
    );
  }

  return el(
    'section',
    {
      className: `state state--${options.kind}`,
      role: 'status',
      'aria-live': options.kind === 'error' ? 'assertive' : 'polite',
    },
    children,
  );
}

/**
 * 加载中。`aria-busy` 让读屏知道这里的等待是有意义的。
 *
 * @param {string} [title]
 * @returns {HTMLElement}
 */
export function createLoading(title = '马上就好…') {
  const node = createState({ kind: 'loading', title, hint: '正在准备页面。' });
  node.setAttribute('aria-busy', 'true');
  return node;
}

/**
 * 空态。
 *
 * @param {object} [options]
 * @param {string} [options.title] 主文案；默认用温和的中性说法
 * @param {string} [options.hint]
 * @param {StateAction} [options.action]
 * @returns {HTMLElement}
 */
export function createEmptyState(options = {}) {
  return createState({
    kind: 'empty',
    title: options.title ?? '这里还没有内容',
    hint: options.hint ?? '可以让家长帮忙看看。',
    action: options.action,
  });
}

/**
 * 错误态。默认给「再试一次」，避免孩子卡在死路上。
 *
 * @param {object} [options]
 * @param {string} [options.title]
 * @param {string} [options.hint]
 * @param {string} [options.detail] 技术细节（默认折叠）
 * @param {StateAction} [options.action]
 * @param {StateAction} [options.secondaryAction]
 * @returns {HTMLElement}
 */
export function createErrorState(options = {}) {
  return createState({
    kind: 'error',
    title: options.title ?? '这一小步没走通',
    hint: options.hint ?? '我们等一等，再试一次。',
    action: options.action ?? { label: '再试一次', onClick: () => window.location.reload() },
    secondaryAction: options.secondaryAction,
    detail: options.detail,
  });
}
