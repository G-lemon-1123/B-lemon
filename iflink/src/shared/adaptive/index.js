/**
 * 自适应引擎对外出口。
 *
 * 其他模块只从这里 import；不要直接引用内部文件名
 * （`adaptive-engine.js` / `mock-adaptive-engine.js`），
 * 以便实现替换时不影响调用方。
 */

export {
  DEFAULT_SUPPORT_LEVEL,
  FAILS_TO_LOWER,
  SUCCEEDS_TO_RAISE,
  SUPPORT_MAX,
  SUPPORT_MIN,
  clampSupportLevel,
  createAdaptiveEngine,
} from './adaptive-engine.js';

export { createMockAdaptiveEngine } from './mock-adaptive-engine.js';
