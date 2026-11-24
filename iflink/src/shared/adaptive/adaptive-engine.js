/**
 * 自适应引擎（AdaptiveEngine）—— 严格按 docs/CONTRACTS.md §6。
 *
 * 作用：根据情景/情绪的表现，给出「支持等级」，应用壳再把它传给情景与情绪模块。
 *   - 0 = 多提示（更容易）
 *   - 1 = 标准
 *   - 2 = 少提示（更独立）
 *
 * 规则（docs/CONTRACTS.md §6.1、PRD §9.2）：
 *   1. 连续 2 次失败 → 向 0 调整一级。
 *   2. 连续 3 次成功**且少用提示** → 向 2 调整一级。
 *   3. 一次只调整一级，不跳级。
 *   4. 不因用时长短调整（本引擎根本不读时间）。
 *   5. 家长手动锁定后，record 仍然记录，但等级不变。
 *   6. 每次等级调整都要通知订阅者。
 *
 * 注意：
 *   - 引擎只调整「提示多少」，不改变奖励、不扣星星（PRD §9.2）。
 *   - 引擎不记录原始画面、关键点或身份信息，只累加计数。
 *   - 本文件是纯逻辑，不碰 DOM、不碰 storage、不发网络请求。
 */

/** 支持等级下界（多提示）。 */
export const SUPPORT_MIN = 0;

/** 支持等级上界（少提示）。 */
export const SUPPORT_MAX = 2;

/** 默认等级：标准。 */
export const DEFAULT_SUPPORT_LEVEL = 1;

/** 连续多少次失败后降低一级。 */
export const FAILS_TO_LOWER = 2;

/** 连续多少次「少用提示」的成功后提高一级。 */
export const SUCCEEDS_TO_RAISE = 3;

/**
 * 把任意值压到合法等级。
 *
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {0 | 1 | 2}
 */
export function clampSupportLevel(value, fallback = DEFAULT_SUPPORT_LEVEL) {
  if (value === 0 || value === 1 || value === 2) return /** @type {0|1|2} */ (value);
  return /** @type {0|1|2} */ (fallback);
}

/**
 * @typedef {object} AdaptiveEngineStats
 * @property {0|1|2} level 当前支持等级
 * @property {boolean} locked 家长是否已锁定
 * @property {0|1|2|null} manualLevel 锁定时的等级；未锁定为 null
 * @property {number} failStreak 当前连续失败次数
 * @property {number} successStreak 当前连续「少用提示」成功次数
 * @property {number} samples 累计收到的样本数
 */

/**
 * @typedef {object} AdaptiveEngineOptions
 * @property {0|1|2} [initialLevel] 初始等级，默认 1
 * @property {number} [failsToLower] 降低一级所需连续失败次数，默认 2
 * @property {number} [succeedsToRaise] 提高一级所需连续成功次数，默认 3
 */

/**
 * 创建自适应引擎。
 *
 * @param {AdaptiveEngineOptions} [options]
 * @returns {{
 *   record: (sample: {mode: string, success: boolean, attempts: number, hintUsed: boolean, quality?: number}) => void,
 *   getSupportLevel: () => 0|1|2,
 *   subscribe: (handler: (level: 0|1|2) => void) => (() => void),
 *   setManualLevel: (level: 'auto' | 0 | 1 | 2) => void,
 *   reset: () => void,
 *   getStats: () => AdaptiveEngineStats
 * }}
 */
export function createAdaptiveEngine(options = {}) {
  const initialLevel = clampSupportLevel(options.initialLevel, DEFAULT_SUPPORT_LEVEL);
  const failsToLower =
    typeof options.failsToLower === 'number' && options.failsToLower > 0
      ? options.failsToLower
      : FAILS_TO_LOWER;
  const succeedsToRaise =
    typeof options.succeedsToRaise === 'number' && options.succeedsToRaise > 0
      ? options.succeedsToRaise
      : SUCCEEDS_TO_RAISE;

  /** @type {0|1|2} */
  let level = initialLevel;
  let locked = false;
  /** @type {0|1|2|null} */
  let manualLevel = null;
  let failStreak = 0;
  let successStreak = 0;
  let samples = 0;

  /** @type {Set<(level: 0|1|2) => void>} */
  const handlers = new Set();

  /** 通知订阅者；复制一份再遍历，避免回调里退订导致漏通知。 */
  const notify = () => {
    for (const handler of [...handlers]) {
      try {
        handler(level);
      } catch (error) {
        // 单个订阅者出错不应影响引擎本身与其他订阅者。
        console.error('[adaptive] 订阅者回调出错：', error instanceof Error ? error.message : '未知错误');
      }
    }
  };

  /** 清空连击计数。锁定时不累计语义、解锁后从零开始，避免解锁瞬间跳级。 */
  const resetStreaks = () => {
    failStreak = 0;
    successStreak = 0;
  };

  /**
   * 落到新等级；只有真的变化才通知（一次只调一级由调用处保证）。
   *
   * @param {number} next
   */
  const applyLevel = (next) => {
    const clamped = next < SUPPORT_MIN ? SUPPORT_MIN : next > SUPPORT_MAX ? SUPPORT_MAX : next;
    if (clamped === level) return;
    level = /** @type {0|1|2} */ (clamped);
    notify();
  };

  return {
    /**
     * 记录一次表现。
     *
     * 只用 success / hintUsed 两个字段决定等级；
     * attempts 与 quality 只记录、不参与判定（避免把「做得慢」当成能力信号）。
     *
     * @param {{mode: string, success: boolean, attempts: number, hintUsed: boolean, quality?: number}} sample
     * @returns {void}
     */
    record(sample) {
      if (!sample || typeof sample !== 'object') return;

      const success = sample.success === true;
      const hintUsed = sample.hintUsed === true;

      samples += 1;

      if (success) {
        failStreak = 0;
        // 用了提示的成功说明还需要支持，不算进步的连击。
        successStreak = hintUsed ? 0 : successStreak + 1;
      } else {
        successStreak = 0;
        failStreak += 1;
      }

      // 家长锁定：只记录，不改等级（合同 §6.1）。
      if (locked) return;

      if (!success && failStreak >= failsToLower) {
        failStreak = 0;
        applyLevel(level - 1);
        return;
      }

      if (success && successStreak >= succeedsToRaise) {
        successStreak = 0;
        applyLevel(level + 1);
      }
    },

    /** @returns {0|1|2} */
    getSupportLevel() {
      return level;
    },

    /**
     * 订阅等级变化。
     *
     * @param {(level: 0|1|2) => void} handler
     * @returns {() => void} 取消订阅
     */
    subscribe(handler) {
      if (typeof handler !== 'function') return () => {};
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },

    /**
     * 家长锁定等级，或交回自动。
     *
     * - 传 0/1/2：锁定并立即生效；重复设置同一等级不做任何事。
     * - 传 'auto'：解锁；**已经是自动时直接返回**（幂等，避免每次调用都清空连击）。
     *
     * @param {'auto' | 0 | 1 | 2} next
     * @returns {void}
     */
    setManualLevel(next) {
      if (next === 'auto') {
        if (!locked) return;
        locked = false;
        manualLevel = null;
        resetStreaks();
        return;
      }

      if (next !== 0 && next !== 1 && next !== 2) return;

      if (locked && manualLevel === next && level === next) return;

      locked = true;
      manualLevel = next;
      resetStreaks();

      if (level !== next) {
        level = next;
        notify();
      }
    },

    /**
     * 回到初始状态：等级回标准、解锁、连击清零。
     * 重置后主动通知一次，保证界面能同步。
     *
     * @returns {void}
     */
    reset() {
      level = clampSupportLevel(initialLevel, DEFAULT_SUPPORT_LEVEL);
      locked = false;
      manualLevel = null;
      resetStreaks();
      samples = 0;
      notify();
    },

    /**
     * 调试与测试用的快照。
     *
     * @returns {AdaptiveEngineStats}
     */
    getStats() {
      return {
        level,
        locked,
        manualLevel,
        failStreak,
        successStreak,
        samples,
      };
    },
  };
}
