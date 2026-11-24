/**
 * MockInputSource —— 用键盘模拟「光标移动 / 捏合抓起 / 松开 / 翻面」。
 *
 * 依据 docs/CONTRACTS.md §9：手势模块的 mock 允许「自动移动/抓取/挥手，或键盘控制」。
 * 这里选键盘控制，因为可重复、可在自动化测试里精确复现。
 *
 * **不请求摄像头**：本文件没有任何 getUserMedia / mediaDevices 调用，
 * 也不创建 video 元素。它只是在合同的事件语义上模拟一个输入源。
 *
 * 坐标约定（必须与合同 §2.1 一致）：
 *   x、y 都是 0..1 的屏幕归一化坐标，y 向下为正；输出前裁剪到 0..1。
 *
 * 按键：
 *   ← → ↑ ↓  移动光标
 *   空格 / Enter  按住 = grab-start，松开 = grab-end
 *   F  翻面（flip）
 *
 * 事件语义与真实手势模块一致：
 *   grab-start 只在「之前没有抓着」时发一次；grab-end 只在「抓着」时发一次。
 */

/** 每按一次方向键移动的归一化距离。 */
export const MOCK_MOVE_STEP = 0.05;

/**
 * 把坐标裁剪到 0..1（合同 §2.1 要求输出方负责裁剪）。
 *
 * @param {number} value
 * @returns {number}
 */
function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * 创建键盘模拟输入源。
 *
 * @param {{step?: number, initial?: {x: number, y: number}}} [options]
 * @returns {object} 合同里的 InputSource（start/stop/subscribe/getDebugState）
 */
export function createMockInputSource(options = {}) {
  const step = typeof options.step === 'number' && options.step > 0 ? options.step : MOCK_MOVE_STEP;
  const initial = options.initial ?? { x: 0.5, y: 0.5 };

  let running = false;
  let cursor = { x: clamp01(initial.x), y: clamp01(initial.y) };
  let grabbing = false;

  /** @type {Set<(event: any) => void>} */
  const handlers = new Set();

  const emit = (event) => {
    for (const handler of [...handlers]) {
      try {
        handler(event);
      } catch (error) {
        console.error('[input:mock] 订阅者回调出错：', error instanceof Error ? error.message : '未知错误');
      }
    }
  };

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const point = () => ({ x: cursor.x, y: cursor.y });

  const emitMove = () => {
    emit({ type: 'move', at: point(), grab: grabbing, strength: grabbing ? 0.9 : 0, t: now() });
  };

  /**
   * 处理一次按键（拆出来便于测试直接调用）。
   *
   * @param {string} key
   * @returns {void}
   */
  const handleKeyDown = (key) => {
    if (!running) return;

    switch (key) {
      case 'ArrowLeft':
        cursor = { x: clamp01(cursor.x - step), y: cursor.y };
        emitMove();
        return;
      case 'ArrowRight':
        cursor = { x: clamp01(cursor.x + step), y: cursor.y };
        emitMove();
        return;
      case 'ArrowUp':
        cursor = { x: cursor.x, y: clamp01(cursor.y - step) };
        emitMove();
        return;
      case 'ArrowDown':
        cursor = { x: cursor.x, y: clamp01(cursor.y + step) };
        emitMove();
        return;
      case ' ':
      case 'Enter':
        if (!grabbing) {
          grabbing = true;
          emit({ type: 'grab-start', at: point(), t: now() });
        }
        return;
      case 'f':
      case 'F':
        emit({ type: 'flip', direction: 'left', at: point(), t: now() });
        return;
      default:
    }
  };

  /**
   * 处理松开。
   *
   * @param {string} key
   * @returns {void}
   */
  const handleKeyUp = (key) => {
    if (!running) return;
    if (key !== ' ' && key !== 'Enter') return;
    if (!grabbing) return;
    grabbing = false;
    emit({ type: 'grab-end', at: point(), t: now() });
  };

  /** 挂到 window 上的监听器；stop 时必须摘掉，避免残留。 */
  const onKeyDown = (event) => {
    if (!event) return;
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'f', 'F'].includes(event.key);
    if (!handled) return;
    if (typeof event.preventDefault === 'function') event.preventDefault();
    handleKeyDown(event.key);
  };

  const onKeyUp = (event) => {
    if (!event) return;
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (typeof event.preventDefault === 'function') event.preventDefault();
    handleKeyUp(event.key);
  };

  return {
    /**
     * 启动。**不请求摄像头**，只挂键盘监听并发一条 ready。
     *
     * @returns {Promise<void>}
     */
    async start() {
      if (running) return;
      running = true;
      emit({ type: 'status', status: 'loading' });
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
      }
      emit({ type: 'status', status: 'ready' });
    },

    /** 停止：摘键盘监听、清抓取状态、通知 idle。 */
    stop() {
      if (!running) return;
      running = false;
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      }
      grabbing = false;
      emit({ type: 'status', status: 'idle' });
    },

    /**
     * 订阅事件。
     *
     * @param {(event: any) => void} handler
     * @returns {() => void}
     */
    subscribe(handler) {
      if (typeof handler !== 'function') return () => {};
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },

    /** 调试状态；不含任何画面或身份信息。 */
    getDebugState() {
      return {
        running,
        cursor: { ...cursor },
        grabbing,
        handlerCount: handlers.size,
      };
    },

    // ---- 以下为 mock 专用，不属于合同 ----

    /** 测试用：直接注入一次按键。 */
    pressKey(key) {
      handleKeyDown(key);
    },

    /** 测试用：直接注入一次松开。 */
    releaseKey(key) {
      handleKeyUp(key);
    },

    /** 测试用：设置光标位置（0..1）。 */
    setCursor(x, y) {
      cursor = { x: clamp01(x), y: clamp01(y) };
      if (running) emitMove();
    },
  };
}

/** 应用级单例：全应用共用一个模拟输入源。 */
const inputSource = createMockInputSource();

/**
 * 取模拟输入源单例。
 *
 * @returns {ReturnType<typeof createMockInputSource>}
 */
export function getMockInputSource() {
  return inputSource;
}
