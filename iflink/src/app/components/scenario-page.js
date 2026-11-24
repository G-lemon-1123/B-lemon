/**
 * 情景练习页（任务五：用 mock 跑通，并支持切到真实模块）。
 *
 * 组合关系（合同 §7）：
 *   应用壳创建依赖 → ScenarioGame.start({ input, feedback, adaptive, supportLevel })
 *   → InputSource 发 grab-start / grab-end → 状态机选中卡片
 *   → FeedbackService 播提示音 + 说一句（带字幕）→ AdaptiveEngine 记录
 *   → 进入 awaiting-parent，家长控制条出现，不自动 next()。
 *
 * 开关（docs/CONTRACTS.md §7）：
 *   ?cards=real  改用成员 C 的真实模块：本页只留占位，开发控件全部隐藏。
 *   ?debug=1     即使已接真实模块，也显示开发信息。
 *
 * 开发控件（阶段徽章、演示按钮、光标提示、反馈日志）只在 mock 模式或 debug 下出现；
 * 接入真实模块时它们不会渲染，孩子端看不到。
 */

import { el } from './dom.js';
import { getParentControlBar } from './parent-control-bar.js';
import { getCaptionBar } from './caption-bar.js';
import { getCursorOverlay } from './cursor-overlay.js';
import { createEmptyState } from './states.js';
import { getMockAdaptive, getMockScenarioGame } from '../mocks/mock-scenario-game.js';
import { getMockInputSource } from '../mocks/mock-input-source.js';
import { getMockFeedback } from '../mocks/mock-feedback-service.js';
import { getSettings } from '../settings.js';
import { readFlags, showDevControls } from '../flags.js';

/** 阶段的中文说明（开发信息）。 */
const PHASE_LABELS = Object.freeze({
  idle: '还没开始',
  loading: '准备中',
  'showing-scenario': '正在展示情景',
  choosing: '等孩子选一张卡',
  correct: '选对了',
  incorrect: '选了另一张',
  'awaiting-parent': '等家长确认',
  finished: '本次练习结束',
});

/** 支持等级的中文名。 */
const LEVEL_LABELS = Object.freeze({ 0: '多提示', 1: '标准', 2: '少提示' });

/** 是否已经完成一次装配（避免每次重绘都重新 start）。 */
let bootstrapped = false;

/** 是否已经订阅状态机（只订阅一次，避免重绘造成重复回调）。 */
let subscribed = false;

/** 最近一次渲染的跳转函数，供状态变化时重绘当前页。 */
let navigateRef = null;

/**
 * 把顶部栏的静音状态同步给反馈服务。
 * 应用壳不实现音效；这里只调用 FeedbackService.setMuted。
 */
function syncMuted() {
  const app = typeof window !== 'undefined' ? window.__shellApp : undefined;
  const muted = app && typeof app.isMuted === 'function' ? app.isMuted() === true : false;
  getMockFeedback().setMuted(muted);
}

/**
 * 建情景练习页。
 *
 * @param {object} options
 * @param {(path: string) => void} options.navigate
 * @returns {HTMLElement}
 */
export function createScenarioPageView(options) {
  const { navigate } = options;
  const flags = readFlags();
  const dev = showDevControls(flags);

  // 接入真实模块时，壳只留位置，不渲染任何演示内容。
  if (flags.cards === 'real') {
    return el('section', { className: 'page page--scenario' }, [
      el('h2', { className: 'page__heading', text: '情景练习' }),
      createEmptyState({
        title: '情景练习还没有接上',
        hint: '已选择使用真实情景模块（?cards=real），但该模块尚未提供。可以先用 ?cards=mock 查看演示。',
        action: { label: '回到主页', onClick: () => navigate('/home') },
      }),
    ]);
  }

  const game = getMockScenarioGame();
  const input = getMockInputSource();
  const feedback = getMockFeedback();
  const adaptive = getMockAdaptive();
  const settings = getSettings();

  // 家长设置 → 自适应引擎 → 情景模块（合同 §6.2）。
  adaptive.setManualLevel(settings.supportLevel);
  game.setSupportLevel(adaptive.getSupportLevel());

  syncMuted();

  const rerender = () => navigate('/scenario');

  // 状态机每次变化都重绘当前页（键盘/输入源选中时也必须更新界面）。
  // 只订阅一次；重绘不会再次订阅，避免回调越堆越多。
  navigateRef = navigate;
  if (!subscribed) {
    subscribed = true;
    game.subscribe(() => {
      if (navigateRef) navigateRef('/scenario');
    });
  }

  /** 首次进入：启动输入源并把依赖交给状态机。 */
  if (!bootstrapped) {
    bootstrapped = true;
    Promise.resolve(input.start())
      .then(() =>
        game.start({
          input,
          feedback,
          adaptive,
          supportLevel: adaptive.getSupportLevel(),
        }),
      )
      .then(() => {
        rerender();
      })
      .catch((error) => {
        console.error('[scenario] 启动失败：', error instanceof Error ? error.message : '未知错误');
      });
  }

  // 控制条自己订阅状态；页面重绘由上面的 game.subscribe 统一负责。
  const bar = getParentControlBar({ scenarioGame: game });

  const state = game.getState();
  const level = adaptive.getSupportLevel();

  /** 情景卡 */
  const scenarioCard = el('div', { className: 'scenario-card' }, [
    el('h3', { className: 'scenario-card__title', text: state.title || '正在准备…' }),
    el('p', { className: 'scenario-card__text', text: state.situationText || '' }),
    el('p', { className: 'scenario-card__prompt', text: state.promptText || '' }),
  ]);

  /** 选项按钮 */
  const optionNodes = state.options.map((option) =>
    el('button', {
      className: `scenario-option scenario-option--${option.state}`,
      type: 'button',
      text: option.text,
      'data-option-state': option.state,
      'aria-disabled': state.phase === 'choosing' ? 'false' : 'true',
      onClick: () => {
        // 正式演示走 InputSource；这里保留鼠标点击，保证无键盘/无手势时也能操作（PRD §4.1）。
        if (state.phase !== 'choosing') return;
        game.pickOption(option.optionId);
        rerender();
      },
    }),
  );

  const optionsGroup = el('div', { className: 'scenario-options' }, optionNodes);

  /** 结果说明：选错时是「还可以这样试试」，不出现「你错了」。 */
  const resultBlock =
    state.result !== null
      ? el('div', { className: `scenario-result scenario-result--${state.result.isCorrect ? 'ok' : 'suggest'}` }, [
          el('p', {
            className: 'scenario-result__title',
            text: state.result.isCorrect ? '这个选择很合适' : '还可以这样试试',
          }),
          el('p', { className: 'scenario-result__body', text: state.result.explanation }),
        ])
      : null;

  const caption = getCaptionBar();
  const cursor = getCursorOverlay(input);

  /** 开发用：阶段 / 等级 / 进度徽章 */
  const devMeta = dev
    ? el('div', { className: 'scenario-meta', 'data-dev': 'true' }, [
        el('span', { className: 'scenario-meta__chip', text: `阶段：${PHASE_LABELS[state.phase] ?? state.phase}` }),
        el('span', {
          className: 'scenario-meta__chip',
          text: `支持等级：${LEVEL_LABELS[level]}${settings.supportLevel === 'auto' ? '（自动）' : '（家长锁定）'}`,
        }),
        el('span', {
          className: 'scenario-meta__chip',
          text: `第 ${Math.min(state.scenarioIndex + 1, state.totalScenarios)} / ${state.totalScenarios} 个`,
        }),
      ])
    : null;

  /** 开发用：鼠标/键盘操作提示 */
  const devHint = dev
    ? el('p', {
        className: 'scenario-devhint',
        text: '演示操作：方向键移动光标，空格抓起、再按空格松开；也可以直接用鼠标点卡片。',
      })
    : null;

  /** 开发用：反馈日志（只显示最近 3 条，不含任何用户数据） */
  const history = feedback.getHistory();
  const devLog = dev
    ? el('div', { className: 'scenario-devlog' }, [
        el('h4', { className: 'scenario-devlog__title', text: '反馈服务最近调用' }),
        el(
          'ul',
          { className: 'scenario-devlog__list' },
          history.length === 0
            ? [el('li', { text: '（还没有）' })]
            : history.slice(-3).map((entry) =>
                el('li', {
                  text:
                    entry.type === 'cue'
                      ? `音效：${entry.cue}${entry.muted ? '（静音，未发声）' : ''}`
                      : `语音：${entry.text}${entry.muted ? '（静音，仅字幕）' : ''}`,
                }),
              ),
        ),
      ])
    : null;

  /** 开发用：演示控制 */
  const devActions = dev
    ? el('div', { className: 'action-row action-row--wrap' }, [
        el('button', {
          className: 'btn btn--ghost btn--large',
          type: 'button',
          text: '重新开始演示',
          onClick: () => {
            game.start({ input, feedback, adaptive, supportLevel: adaptive.getSupportLevel() }).then(rerender);
          },
        }),
        el('button', {
          className: 'btn btn--ghost btn--large',
          type: 'button',
          text: '切换安静模式（静音）',
          onClick: () => {
            const app = typeof window !== 'undefined' ? window.__shellApp : undefined;
            if (app && typeof app.setMuted === 'function') {
              app.setMuted(!app.isMuted());
              syncMuted();
              rerender();
            }
          },
        }),
      ])
    : null;

  const view = el('section', { className: 'page page--scenario' }, [
    el('h2', { className: 'page__heading', text: '情景练习' }),

    devMeta,
    devHint,

    scenarioCard,
    optionsGroup,
    resultBlock,

    caption.root,

    // 家长控制条：只在 awaiting-parent 显示，长按 1.2 秒生效，不自动 next()。
    bar.root,

    devActions,

    el('div', { className: 'action-row action-row--wrap' }, [
      el('button', {
        className: 'btn btn--ghost btn--large',
        type: 'button',
        text: '回主页',
        onClick: () => navigate('/home'),
      }),
    ]),

    devLog,
    cursor.root,
  ]);

  // 页面挂载后量一次答案卡区域，告诉状态机光标 y 落在哪张卡上。
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => {
      measureOptionsBand(optionsGroup, game);
    });
  }

  return view;
}

/**
 * 量出答案卡区域的纵向区间（0..1 屏幕坐标）并告知状态机。
 *
 * @param {HTMLElement} group
 * @param {object} game
 */
function measureOptionsBand(group, game) {
  try {
    if (!group || typeof group.getBoundingClientRect !== 'function') return;
    const rect = group.getBoundingClientRect();
    const viewportHeight =
      typeof window !== 'undefined' && Number.isFinite(window.innerHeight) && window.innerHeight > 0
        ? window.innerHeight
        : 0;
    if (viewportHeight === 0 || rect.height === 0) return;
    game.setOptionsBand({ top: rect.top / viewportHeight, bottom: rect.bottom / viewportHeight });
  } catch {
    // 量不到就保持默认区间，不影响其他功能。
  }
}
