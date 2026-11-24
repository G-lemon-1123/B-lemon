/**
 * MockScenarioGame —— 应用壳自建的完整版情景状态机（任务五）。
 *
 * 为什么需要它：docs/CONTRACTS.md §9 允许「应用壳可自建简化版」，
 * AI-GUIDE-02 §8.1 要求「MockScenarioGame 模拟 10 个情景、选对/选错、
 * 等待家长、下一步/重试/结束」。21 号若成员 C 的模块没完成，就用它兜底。
 *
 * 与合同的对应关系：
 *   - 字段、phase 取值、next/retry/finish 的生效条件全部按 §6.3。
 *   - 选卡走 `InputSource` 事件：grab-start 记起点 → grab-end 命中卡片 →
 *     选中 → 显示反馈 → 进入 awaiting-parent。**绝不自动 next()**。
 *   - 每次作答调用 `adaptive.record()`（§6.2）。
 *   - 反馈通过 `FeedbackService`：选中音、成功音、语音（带字幕）（§5）。
 *
 * 边界：
 *   - 不实现手势识别、摄像头、音效合成——那些分别属于手势与反馈模块。
 *   - 不写死真实内容：这里只有 10 个**演示**情景；真实内容来自 content/cards.json。
 *   - 不碰存储与网络。
 *
 * mock 专用胶水（不属于合同）：
 *   - `setOptionsBand()`：页面告诉状态机「答案卡在屏幕上的纵向区间」，
 *     状态机据此把光标 y 映射到第几张卡。真实模块自己拥有 DOM，不需要这个。
 *   - `pickOption()`：仅测试/调试用，正式演示请走 InputSource。
 */

import { createAdaptiveEngine } from '../../shared/adaptive/index.js';
import { getMockFeedback } from './mock-feedback-service.js';

/** 应用级自适应引擎：全应用共用一份。 */
const adaptive = createAdaptiveEngine();

/**
 * 取应用级自适应引擎（情景页把它与家长设置的支持等级连起来）。
 *
 * @returns {ReturnType<typeof createAdaptiveEngine>}
 */
export function getMockAdaptive() {
  return adaptive;
}

/**
 * 10 个演示情景。文字都短，且都标了「演示」，不与心理老师审核过的正式内容混淆。
 * 每个情景 2–3 张卡，恰有一个 isBest；允许有多个 isCorrect。
 */
const DEMO_SCENARIOS = [
  {
    scenarioId: 'demo-01',
    title: '演示 1：有人插队',
    situationText: '排队时有人插到你前面。',
    options: [
      { optionId: 'demo-01-best', text: '说“请排队，好吗？”', isCorrect: true, isBest: true, feedback: '用嘴巴说，很好。', explanation: '用语言表达，不动手。' },
      { optionId: 'demo-01-ok', text: '告诉老师', isCorrect: true, isBest: false, feedback: '请大人帮忙也可以。', explanation: '也可以请大人一起处理。' },
      { optionId: 'demo-01-bad', text: '推对方一下', isCorrect: false, isBest: false, feedback: '', explanation: '不动手会更安全。' },
    ],
  },
  {
    scenarioId: 'demo-02',
    title: '演示 2：同学哭了',
    situationText: '旁边的同学哭了。',
    options: [
      { optionId: 'demo-02-best', text: '轻轻问“你还好吗？”', isCorrect: true, isBest: true, feedback: '你愿意先关心别人。', explanation: '先关心一下，再决定要不要找大人。' },
      { optionId: 'demo-02-ok', text: '告诉老师', isCorrect: true, isBest: false, feedback: '请老师来看看也可以。', explanation: '找大人帮忙也是一种办法。' },
      { optionId: 'demo-02-bad', text: '笑他', isCorrect: false, isBest: false, feedback: '', explanation: '不嘲笑别人，会让对方更难过。' },
    ],
  },
  {
    scenarioId: 'demo-03',
    title: '演示 3：想要别人的玩具',
    situationText: '你想玩同学手里的玩具。',
    options: [
      { optionId: 'demo-03-best', text: '问“可以借我玩一下吗？”', isCorrect: true, isBest: true, feedback: '先问一问，很好。', explanation: '先征求同意，对方也可以说不。' },
      { optionId: 'demo-03-ok', text: '等他玩完再问', isCorrect: true, isBest: false, feedback: '等一等也可以。', explanation: '等对方玩完再问，也是一种办法。' },
      { optionId: 'demo-03-bad', text: '直接抢过来', isCorrect: false, isBest: false, feedback: '', explanation: '抢东西会让别人难过。' },
    ],
  },
  {
    scenarioId: 'demo-04',
    title: '演示 4：弄坏了同学的东西',
    situationText: '你不小心弄坏了同学的笔。',
    options: [
      { optionId: 'demo-04-best', text: '说“对不起，我不是故意的”', isCorrect: true, isBest: true, feedback: '愿意说出来，很勇敢。', explanation: '道歉不等于被责怪，是负责任。' },
      { optionId: 'demo-04-bad', text: '藏起来不说', isCorrect: false, isBest: false, feedback: '', explanation: '藏起来会让事情变得更难处理。' },
    ],
  },
  {
    scenarioId: 'demo-05',
    title: '演示 5：被起了外号',
    situationText: '同学给你起了你不喜欢的外号。',
    options: [
      { optionId: 'demo-05-best', text: '说“我不喜欢，请停下”', isCorrect: true, isBest: true, feedback: '说清楚自己的感受，很好。', explanation: '用语言表达边界，不动手。' },
      { optionId: 'demo-05-ok', text: '告诉老师或家长', isCorrect: true, isBest: false, feedback: '找大人帮忙也可以。', explanation: '如果对方继续，先离开并找信任的大人。' },
      { optionId: 'demo-05-bad', text: '打回去', isCorrect: false, isBest: false, feedback: '', explanation: '动手会让两个人都受伤。' },
    ],
  },
  {
    scenarioId: 'demo-06',
    title: '演示 6：想加入游戏',
    situationText: '同学在玩游戏，你也想加入。',
    options: [
      { optionId: 'demo-06-best', text: '问“我可以一起玩吗？”', isCorrect: true, isBest: true, feedback: '先问一问，很好。', explanation: '先询问，给对方选择的空间。' },
      { optionId: 'demo-06-ok', text: '在旁边等一等', isCorrect: true, isBest: false, feedback: '等一等也可以。', explanation: '等合适的机会再问。' },
      { optionId: 'demo-06-bad', text: '直接把他们的玩具拿走', isCorrect: false, isBest: false, feedback: '', explanation: '拿别人的东西会让人不舒服。' },
    ],
  },
  {
    scenarioId: 'demo-07',
    title: '演示 7：妈妈看起来生气了',
    situationText: '妈妈皱着眉，说话声音变大。',
    options: [
      { optionId: 'demo-07-best', text: '轻轻问“妈妈，你怎么了？”', isCorrect: true, isBest: true, feedback: '你有先关心妈妈。', explanation: '可以轻轻问一句，也可以先给彼此空间。' },
      { optionId: 'demo-07-ok', text: '先做自己的事，等妈妈平静', isCorrect: true, isBest: false, feedback: '给彼此一点空间，也可以。', explanation: '等大家平静后，再找机会说一说。' },
      { optionId: 'demo-07-bad', text: '对妈妈大喊', isCorrect: false, isBest: false, feedback: '', explanation: '大喊会让两个人都更难受。' },
    ],
  },
  {
    scenarioId: 'demo-08',
    title: '演示 8：老师说“现在不可以”',
    situationText: '你说想出去玩，老师说现在不可以。',
    options: [
      { optionId: 'demo-08-best', text: '问“为什么现在不可以？”', isCorrect: true, isBest: true, feedback: '问清楚原因，很好。', explanation: '可以表达想知道原因。' },
      { optionId: 'demo-08-ok', text: '说出自己的感受', isCorrect: true, isBest: false, feedback: '说出感受也可以。', explanation: '可以表达失望，但不伤害自己或别人。' },
      { optionId: 'demo-08-bad', text: '躺在地上哭闹', isCorrect: false, isBest: false, feedback: '', explanation: '可以难过，但不用伤害自己的方式。' },
    ],
  },
  {
    scenarioId: 'demo-09',
    title: '演示 9：陌生人的距离',
    situationText: '一个不认识的人靠得比较近，你觉得不舒服。',
    options: [
      { optionId: 'demo-09-best', text: '往后退，走到家长身边', isCorrect: true, isBest: true, feedback: '先离开，做得对。', explanation: '安全第一：先离开，再找信任的大人。' },
      { optionId: 'demo-09-ok', text: '大声说“请不要靠这么近”', isCorrect: true, isBest: false, feedback: '大声说出来也可以。', explanation: '可以大声拒绝，然后去找大人。' },
      { optionId: 'demo-09-bad', text: '跟他走', isCorrect: false, isBest: false, feedback: '', explanation: '不跟不认识的人走。' },
    ],
  },
  {
    scenarioId: 'demo-10',
    title: '演示 10：和同学抢同一个玩具',
    situationText: '你和同学都想玩同一个玩具。',
    options: [
      { optionId: 'demo-10-best', text: '说“我们轮流玩，好吗？”', isCorrect: true, isBest: true, feedback: '一起想办法，很好。', explanation: '先停一停，用语言商量。' },
      { optionId: 'demo-10-ok', text: '告诉老师，请老师帮忙', isCorrect: true, isBest: false, feedback: '请老师帮忙也可以。', explanation: '找大人帮忙也是一种办法。' },
      { optionId: 'demo-10-bad', text: '把玩具抢过来', isCorrect: false, isBest: false, feedback: '', explanation: '抢会让两个人都玩不成。' },
    ],
  },
].map((scenario) => ({ promptText: '你会怎么做？', ...scenario }));

/** 演示情景数量（供界面显示）。 */
export const DEMO_SCENARIO_COUNT = DEMO_SCENARIOS.length;

/** 构造空状态。 */
function createInitialState() {
  return {
    phase: 'idle',
    scenarioId: null,
    title: '',
    situationText: '',
    promptText: '你会怎么做？',
    options: [],
    result: null,
    scenarioIndex: 0,
    totalScenarios: DEMO_SCENARIOS.length,
    canRetry: false,
  };
}

/**
 * 创建完整版 mock 情景状态机。
 *
 * @returns {object} 合同里的 ScenarioGame + 若干 mock 专用方法
 */
export function createMockScenarioGame() {
  let state = createInitialState();
  let supportLevel = adaptive.getSupportLevel();

  /** 答案卡在屏幕上的纵向区间（0..1），由页面告知；缺省铺满全屏。 */
  let optionsBand = { top: 0, bottom: 1 };

  /** @type {{x: number, y: number} | null} 本次捏合的起点 */
  let grabStart = null;

  /** @type {any} 合同依赖，start() 时注入 */
  let input = null;
  let feedback = null;
  let adaptiveRef = null;
  /** @type {(() => void) | null} */
  let unsubscribeInput = null;

  /** @type {Set<(state: any) => void>} */
  const handlers = new Set();

  const emit = () => {
    for (const handler of [...handlers]) {
      try {
        handler(state);
      } catch (error) {
        console.error('[scenario:mock] 订阅者回调出错：', error instanceof Error ? error.message : '未知错误');
      }
    }
  };

  /** 装载第 index 个情景，进入 choosing。 */
  const loadScenario = (index) => {
    const scenario = DEMO_SCENARIOS[index];
    state = {
      ...createInitialState(),
      phase: 'choosing',
      scenarioId: scenario.scenarioId,
      title: scenario.title,
      situationText: scenario.situationText,
      promptText: scenario.promptText,
      options: scenario.options.map((option) => ({ optionId: option.optionId, text: option.text, state: 'idle' })),
      scenarioIndex: index,
    };
  };

  /**
   * 把归一化光标位置映射到某一张卡。
   *
   * @param {{x: number, y: number}} at
   * @returns {string | null}
   */
  const resolveOptionId = (at) => {
    if (!at || state.options.length === 0) return null;
    const { top, bottom } = optionsBand;
    if (!(bottom > top)) return null;
    if (at.y < top || at.y > bottom) return null;
    const ratio = (at.y - top) / (bottom - top);
    const index = Math.min(state.options.length - 1, Math.max(0, Math.floor(ratio * state.options.length)));
    return state.options[index] ? state.options[index].optionId : null;
  };

  /**
   * 选中一张卡（内部实现；外部演示应通过 InputSource 触发）。
   *
   * @param {string} optionId
   * @returns {void}
   */
  const selectOption = (optionId) => {
    if (state.phase !== 'choosing') return;

    const scenario = DEMO_SCENARIOS[state.scenarioIndex];
    const picked = scenario.options.find((option) => option.optionId === optionId);
    if (!picked) return;

    const best = scenario.options.find((option) => option.isBest);
    const acceptableOptionIds = scenario.options.filter((option) => option.isCorrect).map((option) => option.optionId);

    if (feedback) feedback.play('pick');

    state = {
      ...state,
      phase: picked.isCorrect ? 'correct' : 'incorrect',
      canRetry: !picked.isCorrect,
      result: {
        scenarioId: scenario.scenarioId,
        selectedOptionId: picked.optionId,
        isCorrect: picked.isCorrect,
        bestOptionId: best ? best.optionId : '',
        acceptableOptionIds,
        explanation: best ? best.explanation : picked.explanation,
      },
      options: state.options.map((option) => {
        if (option.optionId === picked.optionId) {
          return { ...option, state: picked.isCorrect ? 'correct' : 'selected' };
        }
        if (best && option.optionId === best.optionId) {
          return { ...option, state: 'suggested' };
        }
        return option;
      }),
    };
    emit();

    // 反馈：选对有柔和成功音 + 语音；选错只有温和提示，绝不发“错误音”。
    if (feedback) {
      if (picked.isCorrect) {
        feedback.play('success');
        feedback.speak(picked.feedback || '这个选择很合适。');
      } else {
        feedback.play('retry');
        feedback.speak(best ? best.explanation : picked.explanation);
      }
    }

    // 上报自适应（合同 §6.2）。
    if (adaptiveRef) {
      adaptiveRef.record({
        mode: 'scenario',
        success: picked.isCorrect,
        attempts: 1,
        hintUsed: false,
      });
    }

    // 显示完反馈后进入等待家长；**不自动 next()**。
    state = { ...state, phase: 'awaiting-parent' };
    emit();
  };

  /**
   * 处理输入事件。
   *
   * @param {any} event
   */
  const handleInput = (event) => {
    if (!event || typeof event.type !== 'string') return;

    if (event.type === 'grab-start') {
      grabStart = event.at ? { x: event.at.x, y: event.at.y } : null;
      return;
    }

    if (event.type === 'grab-end') {
      const at = event.at ?? grabStart;
      grabStart = null;
      if (!at) return;
      const optionId = resolveOptionId(at);
      if (optionId) selectOption(optionId);
      return;
    }

    // move / flip / status 在 mock 里不改变选择状态。
  };

  return {
    /**
     * 启动：订阅 InputSource，装载第一个情景。
     * **不请求摄像头**（摄像头由 InputSource 自己管理）。
     *
     * @param {{input: any, feedback: any, adaptive?: any, supportLevel?: 0|1|2}} opts
     * @returns {Promise<void>}
     */
    async start(opts = {}) {
      const { input: inputRef, feedback: feedbackRef, adaptive: adaptiveOpt, supportLevel: levelOpt } = opts;

      if (unsubscribeInput) {
        unsubscribeInput();
        unsubscribeInput = null;
      }

      input = inputRef ?? null;
      feedback = feedbackRef ?? getMockFeedback();
      adaptiveRef = adaptiveOpt ?? adaptive;

      if (typeof levelOpt === 'number') {
        supportLevel = levelOpt;
      }

      if (input && typeof input.subscribe === 'function') {
        unsubscribeInput = input.subscribe(handleInput);
      }

      loadScenario(0);
      emit();
    },

    /**
     * @param {(state: any) => void} handler
     * @returns {() => void}
     */
    subscribe(handler) {
      if (typeof handler !== 'function') return () => {};
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },

    /** @returns {any} */
    getState() {
      return state;
    },

    /**
     * 家长确认下一步。只在 awaiting-parent 有效。
     *
     * @returns {void}
     */
    next() {
      if (state.phase !== 'awaiting-parent') return;
      const nextIndex = state.scenarioIndex + 1;
      if (nextIndex >= DEMO_SCENARIOS.length) {
        state = { ...state, phase: 'finished' };
        emit();
        return;
      }
      loadScenario(nextIndex);
      emit();
    },

    /**
     * 家长选择再试一次。只在 awaiting-parent 且 canRetry 时有效。
     *
     * @returns {void}
     */
    retry() {
      if (state.phase !== 'awaiting-parent' || state.canRetry !== true) return;
      loadScenario(state.scenarioIndex);
      emit();
    },

    /**
     * 家长结束练习。
     *
     * @returns {void}
     */
    finish() {
      state = { ...state, phase: 'finished' };
      emit();
    },

    /**
     * 应用壳把支持等级传下来（合同 §6.2）。
     *
     * @param {0|1|2} level
     * @returns {void}
     */
    setSupportLevel(level) {
      supportLevel = level;
    },

    /** @returns {0|1|2} */
    getSupportLevel() {
      return supportLevel;
    },

    /**
     * 停止：退订输入，清空监听。
     *
     * @returns {void}
     */
    stop() {
      if (unsubscribeInput) {
        unsubscribeInput();
        unsubscribeInput = null;
      }
      handlers.clear();
      grabStart = null;
    },

    // ---- mock 专用胶水（不属于合同） ----

    /**
     * 告知答案卡在屏幕上的纵向区间，用于把光标 y 映射到卡片。
     * 真实模块自己拥有 DOM，不需要这个方法。
     *
     * @param {{top: number, bottom: number}} band
     */
    setOptionsBand(band) {
      if (!band) return;
      const top = Number.isFinite(band.top) ? band.top : 0;
      const bottom = Number.isFinite(band.bottom) ? band.bottom : 1;
      optionsBand = { top: Math.max(0, top), bottom: Math.min(1, bottom) };
    },

    /**
     * 直接选中一张卡。**仅测试与调试用**；正式演示请通过 InputSource。
     *
     * @param {string} optionId
     */
    pickOption(optionId) {
      selectOption(optionId);
    },
  };
}

/** 应用级单例。 */
const game = createMockScenarioGame();

/**
 * 取情景状态机单例。
 *
 * @returns {ReturnType<typeof createMockScenarioGame>}
 */
export function getMockScenarioGame() {
  return game;
}
