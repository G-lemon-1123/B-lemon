/**
 * 家长控制条单元测试。
 *
 * 运行方式（无需 package.json / vitest）：
 *   node src/app/components/parent-control-bar.test.js
 *
 * 覆盖 docs/CONTRACTS.md §6.3.2 与 AI-GUIDE-02 §7.3 的关键要求：
 *   - 只在 phase === 'awaiting-parent' 时显示；
 *   - 「下一步」长按才生效，短按无效；
 *   - 「再试一次」只在 canRetry 时出现；
 *   - 「结束练习」调用 finish()；
 *   - 不自动 next()：家长不按，状态就一直停在 awaiting-parent。
 *
 * 说明：本文件自带一个极简 DOM 桩，让组件能在 Node 里跑，
 * 不代表浏览器行为；浏览器验收仍要人工打开 demo。
 */

import test from 'node:test';
import assert from 'node:assert/strict';

/* ------------------------------------------------------------------ *
 * 极简 DOM 桩
 * ------------------------------------------------------------------ */

const makeText = (text) => ({ nodeType: 3, textContent: String(text), children: [] });

function makeEl(tag) {
  return {
    nodeType: 1,
    tagName: String(tag).toUpperCase(),
    className: '',
    textContent: '',
    hidden: false,
    dataset: {},
    style: { setProperty() {} },
    attributes: {},
    listeners: {},
    children: [],
    parentNode: null,
    get firstChild() {
      return this.children.length ? this.children[0] : null;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    addEventListener(type, handler) {
      (this.listeners[type] ||= []).push(handler);
    },
    removeEventListener(type, handler) {
      const list = this.listeners[type];
      if (!list) return;
      const index = list.indexOf(handler);
      if (index >= 0) list.splice(index, 1);
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index < 0) throw new Error('removeChild: 不是子节点');
      this.children.splice(index, 1);
      child.parentNode = null;
      return child;
    },
    querySelector() {
      return null;
    },
    focus() {},
  };
}

globalThis.document = {
  createElement: makeEl,
  createTextNode: makeText,
  getElementById: () => null,
  addEventListener() {},
  removeEventListener() {},
  readyState: 'complete',
  title: '',
  body: makeEl('body'),
};

globalThis.window = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  requestAnimationFrame: (fn) => setTimeout(() => fn(0), 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
};

/* ------------------------------------------------------------------ *
 * 测试辅助
 * ------------------------------------------------------------------ */

const { createParentControlBar, PARENT_CONFIRM_HOLD_MS } = await import('./parent-control-bar.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 文本聚合，用来断言「家长」标识等文案。 */
const allText = (node) => {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent;
  return (node.textContent || '') + (node.children || []).map(allText).join(' ');
};

const findAll = (node, predicate, out = []) => {
  if (!node || node.nodeType !== 1) return out;
  if (predicate(node)) out.push(node);
  (node.children || []).forEach((child) => findAll(child, predicate, out));
  return out;
};

const clickOf = (node) => node.listeners.click[0];

/** 造一个假的情景状态机，记录被调用的次数。 */
function createFakeGame(initialState = {}) {
  let state = {
    phase: 'choosing',
    scenarioId: 'demo-1',
    title: '演示',
    situationText: '',
    promptText: '',
    options: [],
    result: null,
    scenarioIndex: 0,
    totalScenarios: 3,
    canRetry: false,
    ...initialState,
  };
  const calls = { next: 0, retry: 0, finish: 0 };
  const handlers = new Set();

  const emit = () => {
    for (const handler of [...handlers]) handler(state);
  };

  return {
    calls,
    setState(next) {
      state = { ...state, ...next };
      emit();
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    getState() {
      return state;
    },
    next() {
      calls.next += 1;
    },
    retry() {
      calls.retry += 1;
    },
    finish() {
      calls.finish += 1;
    },
    setSupportLevel() {},
    stop() {
      handlers.clear();
    },
    async start() {},
  };
}

/* ------------------------------------------------------------------ *
 * 测试
 * ------------------------------------------------------------------ */

test('默认长按时长是 1.2 秒', () => {
  assert.equal(PARENT_CONFIRM_HOLD_MS, 1200);
});

test('非 awaiting-parent 时控制条隐藏', () => {
  const game = createFakeGame({ phase: 'choosing' });
  const bar = createParentControlBar({ scenarioGame: game });
  assert.equal(bar.root.hidden, true);
  assert.equal(bar.root.getAttribute('data-phase'), 'choosing');
  bar.dispose();
});

test('进入 awaiting-parent 时控制条显示', () => {
  const game = createFakeGame({ phase: 'choosing' });
  const bar = createParentControlBar({ scenarioGame: game });
  game.setState({ phase: 'awaiting-parent' });
  assert.equal(bar.root.hidden, false);
  bar.dispose();
});

test('控制条带「家长」标识，避免孩子误触', () => {
  const game = createFakeGame({ phase: 'awaiting-parent' });
  const bar = createParentControlBar({ scenarioGame: game });
  assert.match(allText(bar.root), /家长/);
  bar.dispose();
});

test('「再试一次」只在 canRetry 时出现', () => {
  const game = createFakeGame({ phase: 'awaiting-parent', canRetry: false });
  const bar = createParentControlBar({ scenarioGame: game });
  const retryWrapper = findAll(bar.root, (node) => node.className === 'longpress' && allText(node).includes('再试一次'))[0];
  assert.ok(retryWrapper, '应能找到「再试一次」按钮');
  assert.equal(retryWrapper.hidden, true, 'canRetry=false 时应隐藏');

  game.setState({ canRetry: true });
  assert.equal(retryWrapper.hidden, false, 'canRetry=true 时应显示');
  bar.dispose();
});

test('「下一步」短按不会触发 next()', async () => {
  const game = createFakeGame({ phase: 'awaiting-parent' });
  const bar = createParentControlBar({ scenarioGame: game, holdMs: 60 });
  const nextBtn = findAll(bar.root, (node) => node.tagName === 'BUTTON' && allText(node).includes('下一步'))[0];
  nextBtn.listeners.pointerdown[0]({ button: 0, preventDefault() {} });
  nextBtn.listeners.pointerup[0]({});
  await sleep(120);
  assert.equal(game.calls.next, 0, '短按不应调用 next()');
  bar.dispose();
});

test('「下一步」长按到时长后才调用 next()', async () => {
  const game = createFakeGame({ phase: 'awaiting-parent' });
  const bar = createParentControlBar({ scenarioGame: game, holdMs: 60 });
  const nextBtn = findAll(bar.root, (node) => node.tagName === 'BUTTON' && allText(node).includes('下一步'))[0];
  nextBtn.listeners.pointerdown[0]({ button: 0, preventDefault() {} });
  await sleep(140);
  assert.equal(game.calls.next, 1, '长按满后应调用一次 next()');
  bar.dispose();
});

test('按住中途松开不会调用 next()', async () => {
  const game = createFakeGame({ phase: 'awaiting-parent' });
  const bar = createParentControlBar({ scenarioGame: game, holdMs: 120 });
  const nextBtn = findAll(bar.root, (node) => node.tagName === 'BUTTON' && allText(node).includes('下一步'))[0];
  nextBtn.listeners.pointerdown[0]({ button: 0, preventDefault() {} });
  await sleep(50);
  nextBtn.listeners.pointerup[0]({});
  await sleep(150);
  assert.equal(game.calls.next, 0);
  bar.dispose();
});

test('真实 1.2 秒长按能触发 next()', async () => {
  const game = createFakeGame({ phase: 'awaiting-parent' });
  const bar = createParentControlBar({ scenarioGame: game });
  const nextBtn = findAll(bar.root, (node) => node.tagName === 'BUTTON' && allText(node).includes('下一步'))[0];
  nextBtn.listeners.pointerdown[0]({ button: 0, preventDefault() {} });
  await sleep(700);
  assert.equal(game.calls.next, 0, '0.7 秒时还不该触发');
  await sleep(700);
  assert.equal(game.calls.next, 1, '1.4 秒后应已触发');
  bar.dispose();
});

test('「再试一次」长按后调用 retry()', async () => {
  const game = createFakeGame({ phase: 'awaiting-parent', canRetry: true });
  const bar = createParentControlBar({ scenarioGame: game, holdMs: 60 });
  const retryBtn = findAll(bar.root, (node) => node.tagName === 'BUTTON' && allText(node).includes('再试一次'))[0];
  retryBtn.listeners.pointerdown[0]({ button: 0, preventDefault() {} });
  await sleep(140);
  assert.equal(game.calls.retry, 1);
  bar.dispose();
});

test('「结束练习」点击即调用 finish()', () => {
  const game = createFakeGame({ phase: 'awaiting-parent' });
  const bar = createParentControlBar({ scenarioGame: game });
  const finishBtn = findAll(bar.root, (node) => node.tagName === 'BUTTON' && allText(node).includes('结束练习'))[0];
  clickOf(finishBtn)({});
  assert.equal(game.calls.finish, 1);
  bar.dispose();
});

test('不会自动 next()：等待期间不产生任何调用', async () => {
  const game = createFakeGame({ phase: 'awaiting-parent' });
  const bar = createParentControlBar({ scenarioGame: game });
  await sleep(300);
  assert.equal(game.calls.next, 0);
  assert.equal(game.calls.retry, 0);
  assert.equal(game.calls.finish, 0);
  bar.dispose();
});

test('操作后会回调 afterAction（用于重绘当前页）', async () => {
  const game = createFakeGame({ phase: 'awaiting-parent' });
  const bar = createParentControlBar({ scenarioGame: game, holdMs: 40 });
  let after = 0;
  bar.setAfterAction(() => {
    after += 1;
  });
  const nextBtn = findAll(bar.root, (node) => node.tagName === 'BUTTON' && allText(node).includes('下一步'))[0];
  nextBtn.listeners.pointerdown[0]({ button: 0, preventDefault() {} });
  await sleep(120);
  assert.equal(after, 1);
  bar.dispose();
});

test('dispose 后不再响应状态变化', () => {
  const game = createFakeGame({ phase: 'choosing' });
  const bar = createParentControlBar({ scenarioGame: game });
  game.setState({ phase: 'awaiting-parent' });
  assert.equal(bar.root.hidden, false);
  bar.dispose();
  // 退订后再变状态，root 的状态不再被引擎更新（保持上一次的值即可，关键是不再被订阅）
  game.setState({ phase: 'choosing' });
  assert.equal(bar.root.getAttribute('data-phase'), 'awaiting-parent', 'dispose 后不应再被更新');
});
