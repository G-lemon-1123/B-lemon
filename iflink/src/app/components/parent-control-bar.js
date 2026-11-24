/**
 * 家长控制条：每次作答之后出现，由家长决定「下一步 / 再试一次 / 结束」。
 *
 * 依据 docs/CONTRACTS.md §6.3.2 与 AI-GUIDE-02 §7.3：
 *   - 只在 `phase === 'awaiting-parent'` 时显示，其他阶段必须隐藏。
 *   - 标注「家长」，避免孩子误触。
 *   - 「下一步」长按约 1.2 秒才调用 scenarioGame.next()，短按无效。
 *   - 「再试一次」只在 `canRetry === true`（即选错之后）时出现，长按后调用 retry()。
 *   - 「结束练习」调用 finish()。
 *   - 不自动倒计时、不自动 next()：家长不按就一直等。
 *
 * 边界：应用壳不实现答案卡规则，只显示控制条并调用合同方法。
 * scenarioGame 内部会再校验一次阶段，壳的按钮只是入口。
 */

import { el } from './dom.js';
import { createLongPressButton } from './long-press.js';

/** 「下一步」的长按时长（PRD §7.4：约 1.2 秒）。 */
export const PARENT_CONFIRM_HOLD_MS = 1200;

/**
 * @typedef {object} ParentControlBarOptions
 * @property {object} scenarioGame 合同里的 ScenarioGame
 * @property {number} [holdMs] 长按时长，默认 1200ms
 */

/**
 * 创建家长控制条。**通常不直接调用**，用 getParentControlBar() 拿单例。
 *
 * @param {ParentControlBarOptions} options
 * @returns {{root: HTMLElement, setAfterAction: (fn: (() => void) | null) => void, update: () => void, dispose: () => void, game: object}}
 */
export function createParentControlBar(options) {
  const { scenarioGame, holdMs = PARENT_CONFIRM_HOLD_MS } = options;
  const seconds = (holdMs / 1000).toFixed(1);

  /** @type {(() => void) | null} */
  let afterAction = null;

  const runAfterAction = () => {
    if (afterAction) afterAction();
  };

  const nextButton = createLongPressButton({
    label: '下一步',
    holdMs,
    ariaLabel: `家长确认下一步，按住 ${seconds} 秒`,
    onComplete: () => {
      scenarioGame.next();
      runAfterAction();
    },
  });

  const retryButton = createLongPressButton({
    label: '再试一次',
    holdMs,
    ariaLabel: `家长选择再试一次，按住 ${seconds} 秒`,
    onComplete: () => {
      scenarioGame.retry();
      runAfterAction();
    },
  });

  const finishButton = el('button', {
    className: 'btn btn--ghost parentbar__finish',
    type: 'button',
    text: '结束练习',
    onClick: () => {
      scenarioGame.finish();
      runAfterAction();
    },
  });

  const root = el(
    'section',
    {
      className: 'parentbar',
      'aria-label': '家长控制条',
      role: 'group',
    },
    [
      el('div', { className: 'parentbar__head' }, [
        el('span', { className: 'parentbar__badge', text: '家长' }),
        el('span', { className: 'parentbar__title', text: '这一题做完了，下一步由您决定' }),
      ]),
      el('div', { className: 'parentbar__actions' }, [nextButton.root, retryButton.root, finishButton]),
      el('p', {
        className: 'parentbar__hint',
        text: `长按 ${seconds} 秒才生效，短按无效；不按就一直等在这里。`,
      }),
    ],
  );

  /**
   * 根据情景状态决定显示什么。
   *
   * @param {{phase?: string, canRetry?: boolean} | null | undefined} state
   */
  const apply = (state) => {
    const waiting = !!state && state.phase === 'awaiting-parent';
    root.hidden = !waiting;
    root.setAttribute('data-phase', state && typeof state.phase === 'string' ? state.phase : 'none');

    // 「再试一次」只在选错之后出现。
    retryButton.root.hidden = !(waiting && state && state.canRetry === true);
  };

  const unsubscribe = scenarioGame.subscribe(apply);
  apply(scenarioGame.getState());

  return {
    root,
    /** 每次操作之后要做什么（例如重绘当前页）。 */
    setAfterAction(fn) {
      afterAction = typeof fn === 'function' ? fn : null;
    },
    /** 主动同步一次（外部改了状态但没发通知时用）。 */
    update() {
      apply(scenarioGame.getState());
    },
    /** 退订并取消进行中的长按。 */
    dispose() {
      unsubscribe();
      nextButton.cancel();
      retryButton.cancel();
    },
    game: scenarioGame,
  };
}

/** @type {ReturnType<typeof createParentControlBar> | null} */
let singleton = null;

/**
 * 取家长控制条单例。
 *
 * 为什么用单例：路由重绘会把旧页面 DOM 丢掉，如果每次渲染都新建控制条，
 * 就会留下越来越多的订阅（内存泄漏、回调重复触发）。单例只订阅一次，
 * 每次渲染把同一个 root 重新挂到新页面上即可（DOM 节点会被“移动”）。
 *
 * @param {ParentControlBarOptions} options
 * @returns {ReturnType<typeof createParentControlBar>}
 */
export function getParentControlBar(options) {
  if (singleton && singleton.game === options.scenarioGame) {
    return singleton;
  }
  if (singleton) singleton.dispose();
  singleton = createParentControlBar(options);
  return singleton;
}

/** 销毁单例（测试与退出时用）。 */
export function resetParentControlBar() {
  if (singleton) {
    singleton.dispose();
    singleton = null;
  }
}
