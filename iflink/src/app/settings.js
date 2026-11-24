/**
 * 家长设置与练习进度 —— **只存在内存里**。
 *
 * 为什么不用 localStorage / sessionStorage：
 *   本阶段明确要求「刷新后重置」，且存储器一旦落盘就要承担「清除记录」的
 *   隐私承诺（PRD §10.3）。所以这里用模块级变量存状态，页面刷新即回到默认值。
 *   等以后要真正持久化时，只需在本文件内部换实现，界面代码不用改。
 *
 * 允许存什么（PRD §14 / AI-GUIDE-02 §6.2）：
 *   设置：四种表情开关、单次情景数量、支持等级。
 *   进度：星星、完成情景数、表情卡、完成次数、最后使用日期。
 *
 * 绝不存什么：
 *   原始画面、人脸/手部关键点、姓名、联系方式、学校、任何可识别身份的信息。
 *
 * 措辞纪律：支持等级是「多提示 / 标准 / 少提示」，不给孩子看到「简单/困难」。
 */

/** 四种表情的固定顺序（与合同 §4.2 一致）。 */
export const EXPRESSION_IDS = Object.freeze(['happy', 'surprised', 'sad', 'angry']);

/** 表情显示名；孩子与家长看到的是中文。 */
export const EXPRESSION_LABELS = Object.freeze({
  happy: '开心',
  surprised: '惊讶',
  sad: '难过',
  angry: '生气',
});

/** 单次情景数量的可选值（PRD §7.4：默认 5，建议 3–5）。 */
export const MAX_SCENARIO_CHOICES = Object.freeze([3, 4, 5]);

/** 单次情景数量默认值（PRD §5.1、§7.4）。 */
export const DEFAULT_MAX_SCENARIOS = 5;

/**
 * 支持等级选项。
 * `auto` 表示交给自适应引擎；数字与合同 §2.3 的 SupportLevel 一致。
 *
 * @type {ReadonlyArray<{value: 'auto' | 0 | 1 | 2, label: string, hint: string}>}
 */
export const SUPPORT_CHOICES = Object.freeze([
  { value: 'auto', label: '自动', hint: '按孩子表现自动调整' },
  { value: 0, label: '多提示', hint: '提示更早、目标更大' },
  { value: 1, label: '标准', hint: '默认难度' },
  { value: 2, label: '少提示', hint: '提示更晚、更独立' },
]);

/** 默认支持等级：自动。 */
export const DEFAULT_SUPPORT_LEVEL = 'auto';

/** 每次「清除练习记录」后显示的提示，供界面复用同一句话。 */
export const CLEAR_DONE_TEXT = '练习记录已清除。设置保持不变。';

/**
 * 设置。用模块级变量保存，进程内有效。
 */
const settings = {
  /** @type {Record<string, boolean>} */
  expressions: { happy: true, surprised: true, sad: true, angry: true },
  /** @type {number} */
  maxScenarios: DEFAULT_MAX_SCENARIOS,
  /** @type {'auto' | 0 | 1 | 2} */
  supportLevel: DEFAULT_SUPPORT_LEVEL,
};

/**
 * 练习进度。本阶段没有真实练习，初始都是 0；
 * 任务四/五接上 mock 后会通过 recordScenarioDone / recordEmotionDone 更新。
 */
const progress = {
  stars: 0,
  completedScenarios: 0,
  expressionCards: 0,
  sessions: 0,
  /** @type {string | null} 只存日期字符串（例如 '2026-11-24'），不含时间与身份信息 */
  lastUsedDate: null,
};

/**
 * 取当前设置的**副本**，避免调用方直接改内部对象。
 *
 * @returns {{expressions: Record<string, boolean>, maxScenarios: number, supportLevel: 'auto' | 0 | 1 | 2}}
 */
export function getSettings() {
  return {
    expressions: { ...settings.expressions },
    maxScenarios: settings.maxScenarios,
    supportLevel: settings.supportLevel,
  };
}

/**
 * 判断某个表情 id 是否合法。
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isExpressionId(id) {
  return EXPRESSION_IDS.includes(id);
}

/**
 * 开关某个表情。
 *
 * @param {string} id 表情 id（happy / surprised / sad / angry）
 * @param {boolean} enabled
 * @returns {boolean} 真正生效后的状态；id 非法时返回 false 且不修改
 */
export function setExpressionEnabled(id, enabled) {
  if (!isExpressionId(id)) return false;
  settings.expressions[id] = enabled === true;
  return settings.expressions[id];
}

/**
 * 取某个表情是否开启。
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isExpressionEnabled(id) {
  return isExpressionId(id) ? settings.expressions[id] === true : false;
}

/**
 * 设置单次情景数量；只接受 3 / 4 / 5，其他值忽略。
 *
 * @param {number} count
 * @returns {number} 生效后的值
 */
export function setMaxScenarios(count) {
  if (!MAX_SCENARIO_CHOICES.includes(count)) return settings.maxScenarios;
  settings.maxScenarios = count;
  return settings.maxScenarios;
}

/**
 * 设置支持等级；只接受 'auto' / 0 / 1 / 2。
 *
 * @param {'auto' | 0 | 1 | 2} level
 * @returns {'auto' | 0 | 1 | 2} 生效后的值
 */
export function setSupportLevel(level) {
  const valid = level === 'auto' || level === 0 || level === 1 || level === 2;
  if (!valid) return settings.supportLevel;
  settings.supportLevel = level;
  return settings.supportLevel;
}

/**
 * 取进度副本。
 *
 * @returns {{stars: number, completedScenarios: number, expressionCards: number, sessions: number, lastUsedDate: string | null}}
 */
export function getProgress() {
  return { ...progress };
}

/**
 * 记录完成一个情景（任务四/五接入后使用）。
 *
 * @param {{stars?: number}} [delta]
 * @returns {void}
 */
export function recordScenarioDone(delta = {}) {
  progress.completedScenarios += 1;
  progress.stars += typeof delta.stars === 'number' && delta.stars > 0 ? delta.stars : 1;
  stampToday();
}

/**
 * 记录获得一张表情卡（任务四/五接入后使用）。
 *
 * @returns {void}
 */
export function recordEmotionDone() {
  progress.expressionCards += 1;
  progress.stars += 1;
  stampToday();
}

/** 记一次练习会话的开始。 */
export function recordSessionStart() {
  progress.sessions += 1;
  stampToday();
}

/**
 * 只写日期，不写时间戳：时间戳可以用来推断作息，属于不必要的信息。
 *
 * @returns {void}
 */
function stampToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  progress.lastUsedDate = `${now.getFullYear()}-${month}-${day}`;
}

/**
 * 清除练习记录：星星、完成数、表情卡、次数、最后使用日期归零。
 * **设置保持不动**（AI-GUIDE-02 §6.3 检查项）。
 *
 * @returns {void}
 */
export function clearProgress() {
  progress.stars = 0;
  progress.completedScenarios = 0;
  progress.expressionCards = 0;
  progress.sessions = 0;
  progress.lastUsedDate = null;
}

/**
 * 把设置恢复默认（不清进度）。测试与「重新开始」用。
 *
 * @returns {void}
 */
export function resetSettings() {
  settings.expressions = { happy: true, surprised: true, sad: true, angry: true };
  settings.maxScenarios = DEFAULT_MAX_SCENARIOS;
  settings.supportLevel = DEFAULT_SUPPORT_LEVEL;
}

/**
 * 设置与进度全部归零。测试用。
 *
 * @returns {void}
 */
export function resetAll() {
  resetSettings();
  clearProgress();
}
