/**
 * MockAdaptiveEngine —— 固定支持等级，便于测试与演示。
 *
 * 合同 §9 规定 MockAdaptiveEngine 放在 `src/shared/adaptive/`，并且
 * 「Mock 必须实现与真实实现完全相同的接口」。
 *
 * 用途：
 *   - 21 号兜底：自适应引擎出问题时，直接锁定一个等级跑通流程。
 *   - 单测：需要「等级不变」的确定行为时用它，避免连击逻辑干扰。
 *
 * 行为：
 *   - record() 什么都不做（只保留接口）。
 *   - getSupportLevel() 永远返回创建时给的等级。
 *   - setManualLevel(0/1/2) 会改这个固定等级；'auto' 被忽略（mock 没有自动逻辑）。
 *   - reset() 回到创建时的初始等级。
 */

import { DEFAULT_SUPPORT_LEVEL, clampSupportLevel } from './adaptive-engine.js';

/**
 * 创建固定等级的 mock 引擎。
 *
 * @param {0|1|2} [level] 固定等级，默认 1（标准）
 * @returns {{
 *   record: (sample: object) => void,
 *   getSupportLevel: () => 0|1|2,
 *   subscribe: (handler: (level: 0|1|2) => void) => (() => void),
 *   setManualLevel: (level: 'auto' | 0 | 1 | 2) => void,
 *   reset: () => void,
 *   getStats: () => {level: 0|1|2, locked: boolean, manualLevel: 0|1|2|null, failStreak: number, successStreak: number, samples: number}
 * }}
 */
export function createMockAdaptiveEngine(level = DEFAULT_SUPPORT_LEVEL) {
  const initialLevel = clampSupportLevel(level, DEFAULT_SUPPORT_LEVEL);
  /** @type {0|1|2} */
  let current = initialLevel;
  let locked = true;
  /** @type {Set<(level: 0|1|2) => void>} */
  const handlers = new Set();

  const notify = () => {
    for (const handler of [...handlers]) {
      try {
        handler(current);
      } catch (error) {
        console.error('[adaptive:mock] 订阅者回调出错：', error instanceof Error ? error.message : '未知错误');
      }
    }
  };

  return {
    /** mock 不参与自适应：记录但不改变等级。 */
    record() {},

    /** @returns {0|1|2} */
    getSupportLevel() {
      return current;
    },

    /**
     * @param {(level: 0|1|2) => void} handler
     * @returns {() => void}
     */
    subscribe(handler) {
      if (typeof handler !== 'function') return () => {};
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },

    /**
     * 只有显式等级会生效；'auto' 在 mock 里没有意义，忽略。
     *
     * @param {'auto' | 0 | 1 | 2} next
     * @returns {void}
     */
    setManualLevel(next) {
      if (next !== 0 && next !== 1 && next !== 2) return;
      if (next === current) {
        locked = true;
        return;
      }
      current = next;
      locked = true;
      notify();
    },

    /** 回到创建时的等级。 */
    reset() {
      current = initialLevel;
      locked = true;
      notify();
    },

    /** 调试与测试用。 */
    getStats() {
      return {
        level: current,
        locked,
        manualLevel: locked ? current : null,
        failStreak: 0,
        successStreak: 0,
        samples: 0,
      };
    },
  };
}
