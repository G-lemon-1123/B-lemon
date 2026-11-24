/**
 * URL 开关：决定用真实模块还是 mock，以及是否显示开发用控件。
 *
 * 依据 docs/CONTRACTS.md §7 推荐开关：
 *   ?input=gesture | pointer
 *   ?emotion=real | mock
 *   ?cards=real | mock
 *   ?debug=1
 *   ?bot=1
 *
 * 为什么要有这些开关：
 *   21 号整合时某个模块没完成，就把它切回 mock，保证演示完整
 *   （PRD §13.3「坏了就切 mock，21 号不现场重写」）。
 *
 * 默认全部走 mock：本分支还没有真实模块。接入真实模块时改 URL 即可，
 * 不需要改代码。
 */

/**
 * @typedef {object} ShellFlags
 * @property {boolean} debug 是否显示开发信息
 * @property {'mock' | 'real'} cards 情景卡牌来源
 * @property {'pointer' | 'gesture'} input 输入来源
 * @property {'mock' | 'real'} feedback 反馈来源
 * @property {'mock' | 'real'} emotion 情绪来源
 * @property {boolean} bot 是否使用测试机器人
 */

/**
 * 解析地址栏里的开关。
 *
 * @param {string} [search] location.search，例如 '?debug=1&cards=real'
 * @returns {ShellFlags}
 */
export function readFlags(search) {
  let raw = search;
  if (typeof raw !== 'string') {
    raw = typeof window !== 'undefined' && typeof window.location?.search === 'string' ? window.location.search : '';
  }

  /** @type {Map<string, string>} */
  let params;
  try {
    params = new Map(new URLSearchParams(raw));
  } catch {
    params = new Map();
  }

  const pick = (key, fallback) => params.get(key) ?? fallback;

  return {
    debug: pick('debug', '0') === '1',
    cards: pick('cards', 'mock') === 'real' ? 'real' : 'mock',
    input: pick('input', 'pointer') === 'gesture' ? 'gesture' : 'pointer',
    feedback: pick('feedback', 'mock') === 'real' ? 'real' : 'mock',
    emotion: pick('emotion', 'mock') === 'real' ? 'real' : 'mock',
    bot: pick('bot', '0') === '1',
  };
}

/**
 * 是否显示开发用控件（阶段徽章、演示按钮、光标提示、反馈日志）。
 *
 * 规则：`?debug=1` 或仍在用 mock 情景模块时显示。
 * 一旦 `?cards=real`（接入成员 C 的真实模块），开发控件自动隐藏，
 * 孩子端不会看到这些演示元素。
 *
 * @param {ShellFlags} flags
 * @returns {boolean}
 */
export function showDevControls(flags) {
  return flags.debug || flags.cards === 'mock';
}

/** 当前开关（每次都重新读地址栏，避免缓存导致切不过去）。 */
export function currentFlags() {
  return readFlags();
}
