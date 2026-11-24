/**
 * 路由表：欢迎/首次说明、主页、情景练习、情绪镜子、小结、家长角。
 *
 * 任务一（页面壳和路由）只做页面结构与跳转，**不接真实摄像头/模型/情景选择**。
 * 具体游戏规则属于任务三/四，本文件里对应页面只放占位骨架。
 */

import { el } from './components/dom.js';
import { createEmptyState } from './components/states.js';
import { createConsentView } from './components/consent.js';
import { createLongPressButton } from './components/long-press.js';
import { createParentCornerView, resetClearConfirm } from './components/parent-corner.js';
import { createScenarioPageView } from './components/scenario-page.js';

/** 家长角长按时长：约 2 秒（AI-GUIDE-02 §6.1），防止孩子误触。 */
const PARENT_HOLD_MS = 2000;

/**
 * 生成一个占位页面：说明这一页将来放什么，以及现在还不能做什么。
 *
 * @param {object} options
 * @param {string} options.heading
 * @param {string} options.body
 * @param {string} options.todo 后续任务里要补的东西
 * @param {Array<{label: string, path: string}>} [options.links]
 * @param {(path: string) => void} options.navigate
 * @returns {HTMLElement}
 */
function placeholder(options) {
  return el('section', { className: 'page' }, [
    el('h2', { className: 'page__heading', text: options.heading }),
    el('p', { className: 'page__lead', text: options.body }),
    el('p', { className: 'page__todo', text: `待补：${options.todo}` }),
    options.links && options.links.length > 0
      ? el(
          'div',
          { className: 'page__links' },
          options.links.map((link) =>
            el('button', {
              className: 'btn btn--ghost btn--large',
              type: 'button',
              text: link.label,
              onClick: () => options.navigate(link.path),
            }),
          ),
        )
      : null,
  ]);
}

/**
 * 主页上的一个大按钮。
 *
 * @param {object} options
 * @param {string} options.label
 * @param {string} options.hint
 * @param {() => void} options.onClick
 * @returns {HTMLElement}
 */
function bigTile(options) {
  return el('button', { className: 'tile', type: 'button', onClick: options.onClick }, [
    el('span', { className: 'tile__label', text: options.label }),
    el('span', { className: 'tile__hint', text: options.hint }),
  ]);
}

/**
 * 构建路由表。
 *
 * @param {object} hooks
 * @param {() => void} hooks.onBreak 顶部栏「休息」
 * @returns {import('../router.js').Route[]}
 */
export function createRoutes(hooks) {
  return [
    {
      id: 'welcome',
      path: '/welcome',
      title: '欢迎',
      showBack: false,
      render: (ctx) =>
        el('section', { className: 'page page--welcome' }, [
          el('h2', { className: 'page__heading page__heading--xl', text: '小步星球' }),
          el('p', { className: 'page__lead', text: '和大人一起，一次一小步。' }),
          el('div', { className: 'page__actions' }, [
            el('button', {
              className: 'btn btn--primary btn--xlarge',
              type: 'button',
              text: '开始',
              // PRD §5.1 首次进入顺序：欢迎 → 家长说明 → 主页；不跳过知情说明。
              onClick: () => ctx.navigate('/parent-intro'),
            }),
          ]),
          el('p', {
            className: 'page__note',
            text: '摄像头只在进入练习页面时、由你点击后才申请；画面只在本设备处理，不录像、不上传。',
          }),
        ]),
    },
    {
      id: 'parent-intro',
      path: '/parent-intro',
      title: '给家长的说明',
      render: (ctx) => createConsentView({ navigate: ctx.navigate }),
    },
    {
      id: 'home',
      path: '/home',
      title: '主页',
      render: (ctx) =>
        el('section', { className: 'page page--home' }, [
          el('h2', { className: 'page__heading', text: '今天想做什么？' }),
          el('div', { className: 'tiles' }, [
            bigTile({
              label: '情景练习',
              hint: '看看可以怎么做',
              onClick: () => ctx.navigate('/scenario'),
            }),
            bigTile({
              label: '情绪镜子',
              hint: '做做表情',
              onClick: () => ctx.navigate('/emotion'),
            }),
          ]),
          // 家长角入口：长按约 2 秒才进入，短按无效，避免孩子误触
          // （PRD §7.4、AI-GUIDE-02 §6.1）。进入前把二次确认状态复位。
          el('div', { className: 'page__footer' }, [
            createLongPressButton({
              label: '家长角',
              holdMs: PARENT_HOLD_MS,
              hint: '家长请按住 2 秒',
              ariaLabel: '长按 2 秒进入家长角',
              onComplete: () => {
                resetClearConfirm();
                ctx.navigate('/parent');
              },
            }).root,
          ]),
        ]),
    },
    {
      id: 'scenario',
      path: '/scenario',
      title: '情景练习',
      render: (ctx) => createScenarioPageView({ navigate: ctx.navigate }),
    },
    {
      id: 'emotion',
      path: '/emotion',
      title: '情绪镜子',
      render: (ctx) =>
        el('section', { className: 'page page--emotion' }, [
          el('h2', { className: 'page__heading', text: '情绪镜子' }),
          createEmptyState({
            title: '情绪镜子还没有接上',
            hint: '情绪识别由成员 D 的模块提供，这里先用占位。',
            action: { label: '回到主页', onClick: () => ctx.navigate('/home') },
          }),
        ]),
    },
    {
      id: 'summary',
      path: '/summary',
      title: '小结',
      render: (ctx) =>
        placeholder({
          heading: '小结',
          body: '这一次练过的情景、星星和一句小提示会显示在这里。',
          todo: '任务四：家长控制条与小结页',
          links: [{ label: '回到主页', path: '/home' }],
          navigate: ctx.navigate,
        }),
    },
    {
      id: 'parent',
      path: '/parent',
      title: '家长角',
      render: (ctx) => createParentCornerView({ navigate: ctx.navigate }),
    },
    {
      id: 'break',
      path: '/break',
      title: '休息一下',
      render: (ctx) =>
        el('section', { className: 'page page--break' }, [
          el('h2', { className: 'page__heading', text: '休息一下' }),
          el('p', { className: 'page__lead', text: '我们慢慢呼吸，准备好了再继续。' }),
          el('div', { className: 'page__actions' }, [
            el('button', {
              className: 'btn btn--primary btn--large',
              type: 'button',
              text: '继续',
              onClick: () => ctx.back(),
            }),
          ]),
          el('p', { className: 'page__note', text: '休息不是任务，随时可以停。' }),
        ]),
    },
  ];
}

/**
 * 「休息」按钮的默认行为：跳到休息页。
 * 抽出来是为了让壳在测试或将来接真实暂停逻辑时能替换掉。
 *
 * @param {import('../router.js').Router} router
 * @returns {() => void}
 */
export function createBreakHandler(router) {
  return () => {
    router.navigate('/break');
  };
}

/** 供外部（例如 demo 页面）复用的占位组件。 */
export { bigTile, placeholder };
