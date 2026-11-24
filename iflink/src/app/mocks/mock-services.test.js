/**
 * Mock 输入源 / 反馈服务 / 情景状态机 / URL 开关 的单元测试。
 *
 * 运行方式（无需 package.json / vitest）：
 *   node src/app/mocks/mock-services.test.js
 *
 * 覆盖 docs/CONTRACTS.md §9「Mock 必须实现与真实实现完全相同的接口」，
 * 以及 §3.2 事件语义、§5.1 字幕规则、§6.3 状态机与「不自动 next」。
 */

import test from 'node:test';
import assert from 'node:assert/strict';

/* ---------------- window 桩（输入源只需要键盘监听） ---------------- */

const windowListeners = {};

globalThis.window = {
  addEventListener(type, handler) {
    (windowListeners[type] ||= []).push(handler);
  },
  removeEventListener(type, handler) {
    const list = windowListeners[type];
    if (!list) return;
    const index = list.indexOf(handler);
    if (index >= 0) list.splice(index, 1);
  },
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
};

const { createMockInputSource } = await import('./mock-input-source.js');
const { createMockFeedbackService } = await import('./mock-feedback-service.js');
const { createMockScenarioGame, DEMO_SCENARIO_COUNT } = await import('./mock-scenario-game.js');
const { createAdaptiveEngine } = await import('../../shared/adaptive/index.js');
const { readFlags, showDevControls } = await import('../flags.js');

/* ---------------- MockInputSource ---------------- */

test('输入源 start 后发 loading 与 ready，且不请求摄像头', async () => {
  const input = createMockInputSource();
  const events = [];
  input.subscribe((event) => events.push(event));

  await input.start();

  assert.deepEqual(
    events.map((e) => e.type),
    ['status', 'status'],
  );
  assert.equal(events[0].status, 'loading');
  assert.equal(events[1].status, 'ready');
  assert.equal(input.getDebugState().running, true);
  input.stop();
});

test('方向键发出 move 事件，坐标为 0..1 且被裁剪', async () => {
  const input = createMockInputSource({ initial: { x: 0.02, y: 0.5 } });
  await input.start();
  const moves = [];
  input.subscribe((event) => {
    if (event.type === 'move') moves.push(event);
  });

  input.pressKey('ArrowLeft'); // 0.02 - 0.05 → 裁剪到 0
  assert.equal(moves.length, 1);
  assert.equal(moves[0].at.x, 0);
  assert.equal(typeof moves[0].t, 'number');

  for (let i = 0; i < 100; i += 1) input.pressKey('ArrowRight');
  assert.ok(moves.every((m) => m.at.x >= 0 && m.at.x <= 1), '坐标必须始终在 0..1');
  input.stop();
});

test('空格按下发一次 grab-start，松开发一次 grab-end', async () => {
  const input = createMockInputSource();
  await input.start();
  const types = [];
  input.subscribe((event) => types.push(event.type));

  input.pressKey(' ');
  input.pressKey(' '); // 重复按下不应再发
  input.releaseKey(' ');
  input.releaseKey(' '); // 重复松开不应再发

  assert.deepEqual(types, ['grab-start', 'grab-end']);
  input.stop();
});

test('F 键发 flip 事件', async () => {
  const input = createMockInputSource();
  await input.start();
  const flips = [];
  input.subscribe((event) => {
    if (event.type === 'flip') flips.push(event);
  });
  input.pressKey('f');
  assert.equal(flips.length, 1);
  assert.equal(typeof flips[0].direction, 'string');
  input.stop();
});

test('stop 后发 idle 且不再响应按键', async () => {
  const input = createMockInputSource();
  await input.start();
  const events = [];
  input.subscribe((event) => events.push(event));

  input.stop();
  assert.equal(events.at(-1).type, 'status');
  assert.equal(events.at(-1).status, 'idle');
  assert.equal(input.getDebugState().running, false);

  const countAfterStop = events.length;
  input.pressKey('ArrowUp');
  assert.equal(events.length, countAfterStop, '停止后不应再发事件');
});

test('输入源接口与合同一致', () => {
  const input = createMockInputSource();
  for (const name of ['start', 'stop', 'subscribe', 'getDebugState']) {
    assert.equal(typeof input[name], 'function', `缺少 ${name}`);
  }
});

/* ---------------- MockFeedbackService ---------------- */

test('speak 会推送字幕', () => {
  const feedback = createMockFeedbackService();
  const captions = [];
  feedback.onCaption((text) => captions.push(text));
  feedback.speak('你有先关心妈妈，很好。');
  assert.deepEqual(captions, ['你有先关心妈妈，很好。']);
});

test('静音后字幕仍然出现（合同 §5.1）', () => {
  const feedback = createMockFeedbackService();
  const captions = [];
  feedback.onCaption((text) => captions.push(text));
  feedback.setMuted(true);
  feedback.speak('请排队，好吗？');
  assert.deepEqual(captions, ['请排队，好吗？'], '静音只停声音，不能停字幕');
  assert.equal(feedback.isMuted(), true);
});

test('play 不产生字幕（音效与字幕分离）', () => {
  const feedback = createMockFeedbackService();
  let captions = 0;
  feedback.onCaption(() => {
    captions += 1;
  });
  feedback.play('success');
  assert.equal(captions, 0);
  assert.equal(feedback.getHistory().at(-1).type, 'cue');
});

test('取消订阅后不再收到字幕', () => {
  const feedback = createMockFeedbackService();
  let count = 0;
  const unsubscribe = feedback.onCaption(() => {
    count += 1;
  });
  feedback.speak('第一次');
  unsubscribe();
  feedback.speak('第二次');
  assert.equal(count, 1);
});

test('反馈服务接口与合同一致', () => {
  const feedback = createMockFeedbackService();
  for (const name of ['play', 'speak', 'setMuted', 'onCaption']) {
    assert.equal(typeof feedback[name], 'function', `缺少 ${name}`);
  }
});

/* ---------------- MockScenarioGame ---------------- */

/** 造一个"新"游戏（互相独立）。 */
const newGame = () => createMockScenarioGame();

/** 让输入源把光标移到第 index 张卡并完成一次抓取/松开。 */
const pickByInput = async (input, game, index, optionCount) => {
  game.setOptionsBand({ top: 0, bottom: 1 });
  const y = (index + 0.5) / optionCount;
  input.setCursor(0.5, y);
  input.pressKey(' ');
  input.releaseKey(' ');
};

test(`演示情景共 ${DEMO_SCENARIO_COUNT} 个`, () => {
  assert.equal(DEMO_SCENARIO_COUNT, 10);
  assert.equal(newGame().getState().totalScenarios, 10);
});

test('start 后进入 choosing 并订阅了输入源', async () => {
  const game = newGame();
  const input = createMockInputSource();
  await input.start();
  await game.start({ input });

  assert.equal(game.getState().phase, 'choosing');
  assert.equal(input.getDebugState().handlerCount, 1, '状态机应订阅了输入源');
  game.stop();
  assert.equal(input.getDebugState().handlerCount, 0, 'stop 后应退订');
  input.stop();
});

test('grab-end 命中卡片 → 进入 awaiting-parent，不自动 next', async () => {
  const game = newGame();
  const input = createMockInputSource();
  await input.start();
  await game.start({ input });

  const optionCount = game.getState().options.length;
  await pickByInput(input, game, 0, optionCount); // 第一张 = isBest
  await new Promise((resolve) => setTimeout(resolve, 20));

  const state = game.getState();
  assert.equal(state.phase, 'awaiting-parent');
  assert.equal(state.result.isCorrect, true);
  assert.equal(state.canRetry, false);

  // 等待一段时间，确认没有自动进入下一题
  const indexBefore = state.scenarioIndex;
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(game.getState().scenarioIndex, indexBefore, '不应自动 next');
  assert.equal(game.getState().phase, 'awaiting-parent');

  game.stop();
  input.stop();
});

test('选错后 canRetry=true，retry 只有此时有效', async () => {
  const game = newGame();
  const input = createMockInputSource();
  await input.start();
  await game.start({ input });

  const optionCount = game.getState().options.length;
  await pickByInput(input, game, optionCount - 1, optionCount); // 最后一张 = 不合适
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(game.getState().result.isCorrect, false);
  assert.equal(game.getState().canRetry, true);

  game.retry();
  assert.equal(game.getState().phase, 'choosing', 'retry 后回到选卡');

  game.retry(); // 已不在 awaiting-parent，应无效
  assert.equal(game.getState().phase, 'choosing');

  game.stop();
  input.stop();
});

test('选对后 retry 无效', async () => {
  const game = newGame();
  const input = createMockInputSource();
  await input.start();
  await game.start({ input });

  const optionCount = game.getState().options.length;
  await pickByInput(input, game, 0, optionCount);
  await new Promise((resolve) => setTimeout(resolve, 20));

  game.retry();
  assert.equal(game.getState().phase, 'awaiting-parent', '选对后 retry 不应生效');
  game.stop();
  input.stop();
});

test('next 前进到下一题，走完后进入 finished', async () => {
  const game = newGame();
  const input = createMockInputSource();
  await input.start();
  await game.start({ input });

  const optionCount = game.getState().options.length;
  await pickByInput(input, game, 0, optionCount);
  await new Promise((resolve) => setTimeout(resolve, 10));
  game.next();
  assert.equal(game.getState().scenarioIndex, 1);
  assert.equal(game.getState().phase, 'choosing');

  game.finish();
  assert.equal(game.getState().phase, 'finished');

  game.next(); // finished 后 next 无效
  assert.equal(game.getState().phase, 'finished');
  game.stop();
  input.stop();
});

test('连续两次选错会把自适应等级降到「多提示」', async () => {
  const adaptive = createAdaptiveEngine();
  assert.equal(adaptive.getSupportLevel(), 1);

  const game = newGame();
  const input = createMockInputSource();
  await input.start();
  await game.start({ input, adaptive });

  const optionCount = game.getState().options.length;
  await pickByInput(input, game, optionCount - 1, optionCount);
  await new Promise((resolve) => setTimeout(resolve, 10));
  game.next();
  await pickByInput(input, game, game.getState().options.length - 1, game.getState().options.length);
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(adaptive.getSupportLevel(), 0, '两次失败应降一级');
  game.stop();
  input.stop();
});

test('选对时通过 FeedbackService 播成功音并说一句', async () => {
  const feedback = createMockFeedbackService();
  const game = newGame();
  const input = createMockInputSource();
  await input.start();
  await game.start({ input, feedback });

  const captions = [];
  feedback.onCaption((text) => captions.push(text));

  const optionCount = game.getState().options.length;
  await pickByInput(input, game, 0, optionCount);
  await new Promise((resolve) => setTimeout(resolve, 10));

  const cues = feedback.getHistory().filter((entry) => entry.type === 'cue').map((entry) => entry.cue);
  assert.ok(cues.includes('pick'), '应有一次选中音');
  assert.ok(cues.includes('success'), '选对应有成功音');
  assert.equal(captions.length, 1, '应有一条字幕');
  assert.ok(captions[0].length > 0);

  game.stop();
  input.stop();
});

test('选错时不发成功音，只给温和解释', async () => {
  const feedback = createMockFeedbackService();
  const game = newGame();
  const input = createMockInputSource();
  await input.start();
  await game.start({ input, feedback });

  const optionCount = game.getState().options.length;
  await pickByInput(input, game, optionCount - 1, optionCount);
  await new Promise((resolve) => setTimeout(resolve, 10));

  const cues = feedback.getHistory().filter((entry) => entry.type === 'cue').map((entry) => entry.cue);
  assert.ok(!cues.includes('success'), '选错不应有成功音');
  assert.ok(!cues.includes('error'), '不存在错误音这个 cue');

  game.stop();
  input.stop();
});

test('光标落在卡片区间之外时不选中', async () => {
  const game = newGame();
  const input = createMockInputSource();
  await input.start();
  await game.start({ input });
  game.setOptionsBand({ top: 0.4, bottom: 0.8 });

  input.setCursor(0.5, 0.05); // 在区间之上
  input.pressKey(' ');
  input.releaseKey(' ');
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(game.getState().phase, 'choosing', '点到空白处不应选中卡片');
  game.stop();
  input.stop();
});

test('情景状态机接口与合同一致', () => {
  const game = newGame();
  for (const name of ['start', 'subscribe', 'getState', 'next', 'retry', 'finish', 'setSupportLevel', 'stop']) {
    assert.equal(typeof game[name], 'function', `缺少 ${name}`);
  }
});

/* ---------------- URL 开关 ---------------- */

test('开关默认值：全部走 mock', () => {
  const flags = readFlags('');
  assert.equal(flags.cards, 'mock');
  assert.equal(flags.input, 'pointer');
  assert.equal(flags.feedback, 'mock');
  assert.equal(flags.emotion, 'mock');
  assert.equal(flags.debug, false);
  assert.equal(flags.bot, false);
});

test('开关能解析 queries', () => {
  const flags = readFlags('?cards=real&input=gesture&debug=1&bot=1&emotion=real&feedback=real');
  assert.equal(flags.cards, 'real');
  assert.equal(flags.input, 'gesture');
  assert.equal(flags.debug, true);
  assert.equal(flags.bot, true);
  assert.equal(flags.emotion, 'real');
  assert.equal(flags.feedback, 'real');
});

test('非法值回退到默认', () => {
  const flags = readFlags('?cards=bogus&input=touch&debug=yes');
  assert.equal(flags.cards, 'mock');
  assert.equal(flags.input, 'pointer');
  assert.equal(flags.debug, false);
});

test('开发控件：mock 模式显示，接真实模块后隐藏', () => {
  assert.equal(showDevControls(readFlags('')), true, 'mock 模式下要能看见演示控件');
  assert.equal(showDevControls(readFlags('?debug=1')), true, 'debug 下显示');
  assert.equal(showDevControls(readFlags('?cards=real')), false, '接真实模块后应隐藏');
  assert.equal(showDevControls(readFlags('?cards=real&debug=1')), true, 'debug 可强制显示');
});
