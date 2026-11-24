/**
 * MockFeedbackService —— 只出字幕，不发声。
 *
 * 依据 docs/CONTRACTS.md §5 与 §9：反馈模块的 mock「不发声，只出字幕」。
 * 真正的音效与语音由成员 E 的 `src/modules/feedback/` 提供；应用壳只调用合同方法。
 *
 * 行为约束（合同 §5.1）：
 *   - play(cue) 必须即时；mock 里只记一条日志，不产生任何声音。
 *   - speak(text) 同时触发字幕；**语音不可用或已静音时，字幕仍然要出现**。
 *   - setMuted(true) 只停声音，不停字幕。
 *   - onCaption(handler) 返回取消订阅函数。
 *
 * 本文件不创建 AudioContext、不加载音频文件、不发网络请求。
 */

/**
 * @typedef {'pick' | 'success' | 'retry' | 'reward' | 'calm'} FeedbackCue
 */

/**
 * 创建 mock 反馈服务。
 *
 * @returns {object} 合同里的 FeedbackService + 两个调试用方法
 */
export function createMockFeedbackService() {
  let muted = false;

  /** @type {Set<(text: string) => void>} */
  const captionHandlers = new Set();

  /** 最近若干条调用记录，仅用于人工验收与测试观察，不含任何用户数据。 */
  const history = [];

  const pushHistory = (entry) => {
    history.push(entry);
    if (history.length > 50) history.shift();
  };

  const emitCaption = (text) => {
    for (const handler of [...captionHandlers]) {
      try {
        handler(text);
      } catch (error) {
        console.error('[feedback:mock] 字幕订阅者出错：', error instanceof Error ? error.message : '未知错误');
      }
    }
  };

  return {
    /**
     * 播放提示音。mock 不发声音，只记录。
     *
     * @param {FeedbackCue} cue
     * @returns {void}
     */
    play(cue) {
      pushHistory({ type: 'cue', cue, muted });
    },

    /**
     * 朗读并显示字幕。**静音时字幕照样出现**（合同 §5.1）。
     *
     * @param {string} text
     * @returns {void}
     */
    speak(text) {
      const value = typeof text === 'string' ? text : '';
      if (!value) return;
      pushHistory({ type: 'speak', text: value, muted });
      emitCaption(value);
    },

    /**
     * 静音开关。只影响声音，不影响字幕。
     *
     * @param {boolean} next
     * @returns {void}
     */
    setMuted(next) {
      muted = next === true;
    },

    /**
     * 订阅字幕。
     *
     * @param {(text: string) => void} handler
     * @returns {() => void}
     */
    onCaption(handler) {
      if (typeof handler !== 'function') return () => {};
      captionHandlers.add(handler);
      return () => {
        captionHandlers.delete(handler);
      };
    },

    // ---- 以下为 mock 专用调试方法，不属于合同 ----

    /** 当前是否静音。 */
    isMuted() {
      return muted;
    },

    /** 最近的调用记录（最多 50 条）。 */
    getHistory() {
      return history.map((entry) => ({ ...entry }));
    },

    /** 清空调用记录。 */
    clearHistory() {
      history.length = 0;
    },
  };
}

/** 应用级单例：全应用共用一条字幕通道。 */
const feedback = createMockFeedbackService();

/**
 * 取反馈服务单例。
 *
 * @returns {ReturnType<typeof createMockFeedbackService>}
 */
export function getMockFeedback() {
  return feedback;
}
