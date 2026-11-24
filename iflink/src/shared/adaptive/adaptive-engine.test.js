/**
 * AdaptiveEngine 单元测试。
 *
 * 运行方式（不需要 package.json / vitest，Node 18+ 自带 node:test）：
 *   node src/shared/adaptive/adaptive-engine.test.js
 *
 * 覆盖 docs/CONTRACTS.md §6.1 与 AI-GUIDE-02 §7.1 要求的行为：
 *   连续失败、连续成功、一次只调一级、边界不越界、
 *   家长手动锁定、订阅通知、reset、以及「不因质量分/次数调整」。
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SUPPORT_LEVEL,
  FAILS_TO_LOWER,
  SUCCEEDS_TO_RAISE,
  clampSupportLevel,
  createAdaptiveEngine,
} from './adaptive-engine.js';
import { createMockAdaptiveEngine } from './mock-adaptive-engine.js';

/** 造一个样本。 */
const sample = (over = {}) => ({
  mode: 'scenario',
  success: true,
  attempts: 1,
  hintUsed: false,
  ...over,
});

/** 连续记录若干个样本。 */
const recordMany = (engine, count, over = {}) => {
  for (let i = 0; i < count; i += 1) engine.record(sample(over));
};

test('默认等级是标准（1）', () => {
  const engine = createAdaptiveEngine();
  assert.equal(engine.getSupportLevel(), DEFAULT_SUPPORT_LEVEL);
  assert.equal(engine.getStats().locked, false);
});

test(`连续 ${FAILS_TO_LOWER} 次失败 → 降一级（1 → 0）`, () => {
  const engine = createAdaptiveEngine();
  recordMany(engine, FAILS_TO_LOWER, { success: false });
  assert.equal(engine.getSupportLevel(), 0);
});

test('连续失败只降一级，不会一次跳两级', () => {
  const engine = createAdaptiveEngine();
  // 恰好两次失败 → 只降一级
  recordMany(engine, 2, { success: false });
  assert.equal(engine.getSupportLevel(), 0);
  // 再来两次 → 已经在 0，不能再降
  recordMany(engine, 2, { success: false });
  assert.equal(engine.getSupportLevel(), 0);
});

test('从 2 降级也只降一级', () => {
  const engine = createAdaptiveEngine({ initialLevel: 2 });
  recordMany(engine, 2, { success: false });
  assert.equal(engine.getSupportLevel(), 1);
});

test('失败之间夹一次成功，连击会被打断', () => {
  const engine = createAdaptiveEngine();
  engine.record(sample({ success: false }));
  engine.record(sample({ success: true, hintUsed: true })); // 用提示的成功，不计升级连击
  engine.record(sample({ success: false }));
  assert.equal(engine.getSupportLevel(), 1, '两次失败不连续，不应降级');
});

test(`连续 ${SUCCEEDS_TO_RAISE} 次「少用提示」的成功 → 升一级（1 → 2）`, () => {
  const engine = createAdaptiveEngine();
  recordMany(engine, SUCCEEDS_TO_RAISE, { success: true, hintUsed: false });
  assert.equal(engine.getSupportLevel(), 2);
});

test('用了提示的成功不计入升级连击', () => {
  const engine = createAdaptiveEngine();
  recordMany(engine, SUCCEEDS_TO_RAISE - 1, { success: true, hintUsed: false });
  engine.record(sample({ success: true, hintUsed: true })); // 打断连击
  recordMany(engine, SUCCEEDS_TO_RAISE - 1, { success: true, hintUsed: false });
  assert.equal(engine.getSupportLevel(), 1, '连击被打断，不应升级');
});

test('成功连击会被失败打断', () => {
  const engine = createAdaptiveEngine();
  recordMany(engine, 2, { success: true, hintUsed: false });
  engine.record(sample({ success: false }));
  recordMany(engine, 2, { success: true, hintUsed: false });
  assert.equal(engine.getSupportLevel(), 1);
});

test('等级不会越界：0 时继续失败仍是 0', () => {
  const engine = createAdaptiveEngine({ initialLevel: 0 });
  recordMany(engine, 10, { success: false });
  assert.equal(engine.getSupportLevel(), 0);
});

test('等级不会越界：2 时继续成功仍是 2', () => {
  const engine = createAdaptiveEngine({ initialLevel: 2 });
  recordMany(engine, 10, { success: true, hintUsed: false });
  assert.equal(engine.getSupportLevel(), 2);
});

test('不因 quality / attempts 改变判定（只用 success 与 hintUsed）', () => {
  const engine = createAdaptiveEngine();
  // 失败但 quality 很高、attempts 很多 → 仍然算失败，两次后降级
  recordMany(engine, 2, { success: false, quality: 1, attempts: 99 });
  assert.equal(engine.getSupportLevel(), 0);
});

test('家长锁定后 record 仍记录，但等级不变', () => {
  const engine = createAdaptiveEngine();
  engine.setManualLevel(2);
  assert.equal(engine.getSupportLevel(), 2);
  const before = engine.getStats().samples;
  recordMany(engine, 10, { success: false });
  assert.equal(engine.getSupportLevel(), 2, '锁定时不应自动降级');
  assert.ok(engine.getStats().samples > before, '锁定时仍应记录样本');
});

test('锁定为 0 时连续成功也不会升级', () => {
  const engine = createAdaptiveEngine();
  engine.setManualLevel(0);
  recordMany(engine, 10, { success: true, hintUsed: false });
  assert.equal(engine.getSupportLevel(), 0);
});

test("setManualLevel('auto') 解锁后恢复自动调整", () => {
  const engine = createAdaptiveEngine();
  engine.setManualLevel(0);
  engine.setManualLevel('auto');
  assert.equal(engine.getStats().locked, false);
  // 解锁后从零开始累计，3 次成功升一级
  recordMany(engine, 3, { success: true, hintUsed: false });
  assert.equal(engine.getSupportLevel(), 1);
});

test("已是自动时重复 setManualLevel('auto') 不会清空连击（幂等）", () => {
  const engine = createAdaptiveEngine();
  engine.record(sample({ success: true, hintUsed: false }));
  engine.record(sample({ success: true, hintUsed: false }));
  engine.setManualLevel('auto'); // 已经是自动，应无副作用
  engine.record(sample({ success: true, hintUsed: false }));
  assert.equal(engine.getSupportLevel(), 2, '连击不应被幂等调用打断');
});

test('setManualLevel 立即生效并通知订阅者', () => {
  const engine = createAdaptiveEngine();
  const seen = [];
  engine.subscribe((level) => seen.push(level));
  engine.setManualLevel(2);
  assert.deepEqual(seen, [2]);
  assert.equal(engine.getSupportLevel(), 2);
});

test('非法手动等级被忽略', () => {
  const engine = createAdaptiveEngine();
  engine.setManualLevel(5);
  engine.setManualLevel(-1);
  engine.setManualLevel('bogus');
  assert.equal(engine.getSupportLevel(), 1);
  assert.equal(engine.getStats().locked, false);
});

test('只有等级真的变化时才通知', () => {
  const engine = createAdaptiveEngine({ initialLevel: 0 });
  let calls = 0;
  engine.subscribe(() => {
    calls += 1;
  });
  recordMany(engine, 6, { success: false }); // 已在 0，怎么失败都不变
  assert.equal(calls, 0, '等级没变就不该通知');
});

test('订阅者能收到每一次等级变化', () => {
  const engine = createAdaptiveEngine();
  const seen = [];
  engine.subscribe((level) => seen.push(level));
  recordMany(engine, 2, { success: false }); // 1 → 0
  recordMany(engine, 3, { success: true, hintUsed: false }); // 0 → 1
  assert.deepEqual(seen, [0, 1]);
});

test('取消订阅后不再收到通知', () => {
  const engine = createAdaptiveEngine();
  let calls = 0;
  const unsubscribe = engine.subscribe(() => {
    calls += 1;
  });
  recordMany(engine, 2, { success: false });
  assert.equal(calls, 1);
  unsubscribe();
  recordMany(engine, 3, { success: true, hintUsed: false });
  assert.equal(calls, 1, '退订后不应再收到');
});

test('单个订阅者抛错不影响引擎与其他订阅者', () => {
  const engine = createAdaptiveEngine();
  const seen = [];
  engine.subscribe(() => {
    throw new Error('订阅者内部错误');
  });
  engine.subscribe((level) => seen.push(level));
  const originalError = console.error;
  console.error = () => {}; // 静音预期内的错误日志
  try {
    recordMany(engine, 2, { success: false });
  } finally {
    console.error = originalError;
  }
  assert.equal(engine.getSupportLevel(), 0, '引擎本身不受影响');
  assert.deepEqual(seen, [0], '其他订阅者仍收到通知');
});

test('reset 回到初始状态并通知', () => {
  const engine = createAdaptiveEngine();
  recordMany(engine, 2, { success: false });
  let notified = 0;
  engine.subscribe(() => {
    notified += 1;
  });
  engine.reset();
  const stats = engine.getStats();
  assert.equal(stats.level, 1);
  assert.equal(stats.locked, false);
  assert.equal(stats.failStreak, 0);
  assert.equal(stats.successStreak, 0);
  assert.equal(stats.samples, 0);
  assert.equal(notified, 1);
});

test('reset 会解除家长锁定', () => {
  const engine = createAdaptiveEngine();
  engine.setManualLevel(2);
  engine.reset();
  assert.equal(engine.getStats().locked, false);
  assert.equal(engine.getSupportLevel(), 1);
});

test('record 收到非法样本不会抛错', () => {
  const engine = createAdaptiveEngine();
  assert.doesNotThrow(() => {
    engine.record(null);
    engine.record(undefined);
    engine.record({});
  });
  assert.equal(engine.getSupportLevel(), 1);
});

test('不同 mode 共用同一套连击（等级只有一份）', () => {
  const engine = createAdaptiveEngine();
  engine.record(sample({ mode: 'scenario', success: false }));
  engine.record(sample({ mode: 'emotion', success: false }));
  assert.equal(engine.getSupportLevel(), 0);
});

test('clampSupportLevel 只放行 0/1/2', () => {
  assert.equal(clampSupportLevel(0), 0);
  assert.equal(clampSupportLevel(1), 1);
  assert.equal(clampSupportLevel(2), 2);
  assert.equal(clampSupportLevel(9), 1);
  assert.equal(clampSupportLevel('2'), 1);
  assert.equal(clampSupportLevel(undefined), 1);
  assert.equal(clampSupportLevel(9, 2), 2);
});

// ---------------- MockAdaptiveEngine ----------------

test('Mock 引擎返回固定等级', () => {
  const mock = createMockAdaptiveEngine(2);
  assert.equal(mock.getSupportLevel(), 2);
  recordMany(mock, 10, { success: false });
  assert.equal(mock.getSupportLevel(), 2, 'mock 不参与自适应');
});

test('Mock 引擎可手动切换等级并通知', () => {
  const mock = createMockAdaptiveEngine(1);
  const seen = [];
  mock.subscribe((level) => seen.push(level));
  mock.setManualLevel(0);
  assert.equal(mock.getSupportLevel(), 0);
  assert.deepEqual(seen, [0]);
});

test("Mock 引擎忽略 'auto'（没有自动逻辑）", () => {
  const mock = createMockAdaptiveEngine(2);
  mock.setManualLevel('auto');
  assert.equal(mock.getSupportLevel(), 2);
});

test('Mock 引擎 reset 回到初始等级', () => {
  const mock = createMockAdaptiveEngine(2);
  mock.setManualLevel(0);
  mock.reset();
  assert.equal(mock.getSupportLevel(), 2);
});

test('Mock 引擎接口与真实引擎一致', () => {
  const real = createAdaptiveEngine();
  const mock = createMockAdaptiveEngine();
  for (const name of ['record', 'getSupportLevel', 'subscribe', 'setManualLevel', 'reset']) {
    assert.equal(typeof real[name], 'function', `真实引擎缺少 ${name}`);
    assert.equal(typeof mock[name], 'function', `mock 缺少 ${name}`);
  }
});
