/**
 * 顶部栏：返回、标题、休息、静音。
 *
 * 为什么放这里而不是每个页面各画一遍：AI-GUIDE-02 任务一要求「一个统一的
 * 页面容器和顶部栏」。统一以后，返回按钮的可用状态、静音图标的一致性、
 * 以及触控热区大小都只有一处实现。
 *
 * 边界：本文件不实现音效。静音开关目前只改一个布尔状态并通知调用方，
 * 真正的音量控制在成员 E 的 `FeedbackService`；壳不自己写音效（PRD §7 / 合同 §5）。
 */

import { el } from './dom.js';

/**
 * 创建顶部栏。
 *
 * @param {object} options
 * @param {string} options.title 当前页面标题
 * @param {boolean} options.canGoBack 是否显示可用的返回按钮
 * @param {() => void} options.onBack 返回
 * @param {() => void} options.onBreak 休息（暂停）
 * @param {boolean} options.muted 当前是否静音
 * @param {() => void} options.onToggleMute 切换静音
 * @returns {HTMLElement}
 */
export function createTopBar(options) {
  const backButton = el('button', {
    className: 'topbar__btn topbar__btn--back',
    type: 'button',
    text: '返回',
    'aria-label': '返回上一页',
    disabled: !options.canGoBack,
    onClick: options.onBack,
  });

  const muteButton = el('button', {
    className: 'topbar__btn topbar__btn--mute',
    type: 'button',
    text: options.muted ? '已静音' : '声音开',
    'aria-pressed': options.muted ? 'true' : 'false',
    'aria-label': options.muted ? '当前已静音，点击开启声音' : '当前有声音，点击静音',
    onClick: options.onToggleMute,
  });

  return el('header', { className: 'topbar' }, [
    backButton,
    el('h1', { className: 'topbar__title', text: options.title }),
    el('div', { className: 'topbar__actions' }, [
      el('button', {
        className: 'topbar__btn topbar__btn--break',
        type: 'button',
        text: '休息',
        'aria-label': '暂停一下，先休息',
        onClick: options.onBreak,
      }),
      muteButton,
    ]),
  ]);
}
