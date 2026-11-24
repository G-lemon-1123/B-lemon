/**
 * 首次家长说明页（知情说明 + 摄像头授权入口）。
 *
 * 依据 AI-GUIDE-02 §5.1，本页必须说清六件事：
 *   1. 摄像头只在进入手势/情绪页时申请；
 *   2. 画面只在本设备处理，不录像、不上传；
 *   3. 可随时关闭摄像头；
 *   4. 可用鼠标/触摸替代；
 *   5. 不是医疗工具、不评价能力；
 *   6. 情景里可能有冲突、被嘲笑、陌生人靠近等，家长可随时结束，孩子不适就停。
 *
 * 边界（重要）：
 *   - 本文件**不调用 getUserMedia**。点「开始摄像头」只记录意图并进入主页，
 *     真正的申请交给进入练习页后的手势/情绪模块（AI-GUIDE-02 §5.1 第 4 条）。
 *   - 因此「没点按钮就弹权限框」在这条路径上不可能发生（FR-01）。
 *   - 拒绝/失败时的温和提示由模块回报后写入 camera-state，本页负责显示，
 *     并且始终保留「用鼠标继续」的出口（§10 降级要求）。
 *
 * 文案口径：短、可扫读、不吓人；不出现「诊断」「治疗」「改善症状」等词
 * （AI-GUIDE-02 §5.2 检查项）。
 */

import { el } from './dom.js';
import { CAMERA_INTENT, getCameraError, setCameraIntent } from '../camera-state.js';

/**
 * 说明条目。每条都短，家长扫一眼就能懂。
 *
 * @type {ReadonlyArray<{title: string, body: string}>}
 */
const CONSENT_POINTS = Object.freeze([
  {
    title: '只在练习时看',
    body: '只有您点了按钮才会请求摄像头；不点就不请求，网页不会自己打开它。',
  },
  {
    title: '画面不离开这台设备',
    body: '画面只在本机计算，不录像、不保存、不上传。',
  },
  {
    title: '随时可以关掉',
    body: '练习页右上角有「休息」；离开页面或关闭标签页，摄像头就会停止。',
  },
  {
    title: '不用摄像头也能玩',
    body: '鼠标、触摸、键盘都能完成同一套练习，内容完全一样。',
  },
  {
    title: '它只做练习',
    body: '这是一个陪伴练习的小工具，不做医疗用途，也不评价孩子的能力高低，不替代老师、医生或您的判断。',
  },
  {
    title: '内容与情绪提醒',
    body: '情景里可能出现冲突、被嘲笑、陌生人靠近等情节。您可以随时结束练习；孩子出现抗拒、哭闹或明显不适时，请立即停下来。',
  },
]);

/**
 * 创建家长说明页。
 *
 * @param {object} options
 * @param {(path: string) => void} options.navigate 路由跳转
 * @returns {HTMLElement}
 */
export function createConsentView(options) {
  const { navigate } = options;
  const error = getCameraError();

  /** @type {Array<Node | null>} */
  const children = [
    el('h2', { className: 'page__heading', text: '给家长的话' }),
    el('p', {
      className: 'page__lead',
      text: '开始之前，请您花一分钟看下面几条。练习由您陪着，节奏由您决定。',
    }),
  ];

  // 上一次摄像头失败/被拒绝时的温和提示；没有就不占位置。
  if (error !== null) {
    children.push(
      el(
        'div',
        {
          className: 'notice notice--error',
          role: 'status',
          'aria-live': 'polite',
        },
        [
          el('p', { className: 'notice__text', text: error }),
          el('p', {
            className: 'notice__hint',
            text: '可以先用鼠标或触摸继续，练习内容完全一样。',
          }),
        ],
      ),
    );
  }

  children.push(
    el(
      'ul',
      { className: 'consent__list' },
      CONSENT_POINTS.map((point) =>
        el('li', { className: 'consent__item' }, [
          el('strong', { className: 'consent__item-title', text: point.title }),
          el('span', { className: 'consent__item-body', text: point.body }),
        ]),
      ),
    ),

    el('div', { className: 'page__actions' }, [
      el('button', {
        className: 'btn btn--primary btn--xlarge',
        type: 'button',
        text: '开始摄像头',
        // 只记录意图，不申请摄像头；真正申请在练习页由对应模块发起。
        onClick: () => {
          setCameraIntent(CAMERA_INTENT.ALLOW);
          navigate('/home');
        },
      }),
      el('button', {
        className: 'btn btn--ghost btn--xlarge',
        type: 'button',
        text: '先不用摄像头，用鼠标继续',
        onClick: () => {
          setCameraIntent(CAMERA_INTENT.SKIP);
          navigate('/home');
        },
      }),
    ]),

    el('p', {
      className: 'page__note',
      text: '隐私说明：不收集姓名、生日、住址、学校或联系方式；练习记录只保存在这台设备上，您可以随时清除。',
    }),
  );

  return el('section', { className: 'page page--consent' }, children);
}
