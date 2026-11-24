/**
 * 长按按钮：必须按住一段时间才触发，短按无效。
 *
 * 为什么要长按：家长角入口和「家长确认下一步」都要防止孩子误触
 * （PRD §6.1「家长控制条要明显标注家长，长按才生效」、§7.4「长按约 1.2 秒」、
 * AI-GUIDE-02 §6.1「长按约 2 秒进入」）。
 *
 * 无障碍（PRD §11 要求键盘可用）：
 *   焦点在按钮上时，按住 Enter / 空格 等效于长按，松开即取消。
 *
 * 纪律：
 *   - 短按不触发、不弹错、不提示「你按错了」，安静回到初始状态。
 *   - 进度用 CSS 变量 + transform 驱动，不逐帧改布局属性。
 *   - 页面切走时调用返回的 cancel()，避免计时器悬挂。
 */

import { el } from './dom.js';

/**
 * @typedef {object} LongPressOptions
 * @property {string} label 按钮文字
 * @property {number} holdMs 需要按住的毫秒数
 * @property {() => void} onComplete 按满后触发
 * @property {string} [className] 追加的 class
 * @property {string} [hint] 按钮下方的辅助说明
 * @property {string} [ariaLabel] 无障碍名称；缺省用 label
 */

/**
 * @typedef {object} LongPressButton
 * @property {HTMLElement} root 外层包裹（按钮 + 提示）
 * @property {HTMLElement} button 按钮本体
 * @property {() => void} cancel 取消进行中的长按
 */

/**
 * 创建长按按钮。
 *
 * @param {LongPressOptions} options
 * @returns {LongPressButton}
 */
export function createLongPressButton(options) {
  const { label, holdMs, onComplete, className, hint, ariaLabel } = options;

  const fill = el('span', { className: 'longpress__fill', 'aria-hidden': 'true' });

  const button = el(
    'button',
    {
      className: `longpress__btn${className ? ' ' + className : ''}`,
      type: 'button',
      'aria-label': ariaLabel ?? label,
    },
    [
      el('span', { className: 'longpress__track', 'aria-hidden': 'true' }, [fill]),
      el('span', { className: 'longpress__label', text: label }),
    ],
  );

  /** @type {number | null} */
  let timer = null;
  /** @type {number | null} */
  let raf = null;
  let active = false;
  let startedAt = 0;

  /**
   * 更新进度条。
   *
   * @param {number} value 0..1
   */
  const setProgress = (value) => {
    const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
    button.style.setProperty('--hold', String(clamped));
    fill.style.transform = `scaleX(${clamped})`;
  };

  const stopTimers = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
    if (raf !== null) {
      window.cancelAnimationFrame(raf);
      raf = null;
    }
  };

  const reset = () => {
    stopTimers();
    active = false;
    button.setAttribute('data-holding', 'false');
    setProgress(0);
  };

  /** 取消进行中的长按（已完成的不受影响）。 */
  const cancel = () => {
    if (active) reset();
  };

  const begin = () => {
    if (active) return;
    active = true;
    startedAt = performance.now();
    button.setAttribute('data-holding', 'true');
    setProgress(0);

    const tick = () => {
      if (!active) return;
      const elapsed = performance.now() - startedAt;
      setProgress(elapsed / holdMs);
      if (elapsed >= holdMs) {
        reset();
        onComplete();
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    // 后台标签页里 rAF 会暂停，用 timeout 兜底保证按满仍会触发。
    timer = window.setTimeout(() => {
      if (active) {
        reset();
        onComplete();
      }
    }, holdMs + 20);
  };

  button.addEventListener('pointerdown', (event) => {
    // 只响应主键；右键不参与长按。
    if (event && event.button !== undefined && event.button !== 0) return;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    begin();
  });

  for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
    button.addEventListener(type, () => cancel());
  }

  // 键盘：按住 Enter / 空格 等效于长按，松开取消。
  button.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (typeof event.preventDefault === 'function') event.preventDefault();
    begin();
  });
  button.addEventListener('keyup', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (typeof event.preventDefault === 'function') event.preventDefault();
    cancel();
  });
  button.addEventListener('blur', () => cancel());

  const wrapper = el('div', { className: 'longpress' }, [button]);

  // 初始就把状态写出来，样式与测试都能直接读到明确值。
  button.setAttribute('data-holding', 'false');
  setProgress(0);

  if (hint !== undefined) {
    wrapper.appendChild(el('p', { className: 'longpress__hint', text: hint }));
  }

  return { root: wrapper, button, cancel };
}
