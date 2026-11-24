/**
 * 摄像头授权的「意图」与最近一次错误。
 *
 * 为什么单独一个模块：
 *   - 应用壳**不允许**自己调用 getUserMedia（AI-GUIDE-02 §5.1 第 4 条）。摄像头只能
 *     由用户点击后、在手势/情绪模块内部申请。所以家长在说明页点「开始摄像头」时，
 *     壳只能**记下意图**，真正申请交给进入练习页后的对应模块。
 *   - 拒绝/失败的结果由模块回报，壳只负责把它转成一句家长看得懂的话，并保留
 *     鼠标继续入口（PRD §4.1 FR-01、合同 §10）。
 *
 * 边界：
 *   - 只存内存，不写 localStorage（存储属于任务三）。
 *   - 不存任何画面、关键点或身份信息。
 */

/** 家长在说明页的选择。 */
export const CAMERA_INTENT = Object.freeze({
  /** 还没选过 */
  UNKNOWN: 'unknown',
  /** 选择使用摄像头；真正申请发生在练习页 */
  ALLOW: 'allow',
  /** 选择不用摄像头，改用鼠标/触摸 */
  SKIP: 'skip',
});

/** @type {string} */
let intent = CAMERA_INTENT.UNKNOWN;

/** @type {string | null} */
let lastError = null;

/**
 * 当前意图。
 *
 * @returns {string}
 */
export function getCameraIntent() {
  return intent;
}

/**
 * 记录家长的选择；选过一次就清掉旧错误，避免回到说明页还挂着上次的提示。
 *
 * @param {string} next CAMERA_INTENT 里的值
 * @returns {void}
 */
export function setCameraIntent(next) {
  intent = next;
  lastError = null;
}

/**
 * 最近一次摄像头错误的温和文案；没有错误时为 null。
 *
 * @returns {string | null}
 */
export function getCameraError() {
  return lastError;
}

/**
 * 记录一条已经翻译好的温和提示（不要传技术错误码）。
 *
 * @param {string} message
 * @returns {void}
 */
export function setCameraError(message) {
  lastError = message;
}

/**
 * 清掉错误提示。
 *
 * @returns {void}
 */
export function clearCameraError() {
  lastError = null;
}

/**
 * 回到初始状态（测试与「重新开始」用）。
 *
 * @returns {void}
 */
export function resetCameraState() {
  intent = CAMERA_INTENT.UNKNOWN;
  lastError = null;
}
