/**
 * 家长角：表情开关、单次情景数量、支持等级、清除练习记录。
 *
 * 依据 AI-GUIDE-02 §6.1 与 PRD §6.1 FR-13。本阶段按任务要求只做四组：
 *   1. 四种表情开关（开心、惊讶、难过、生气）
 *   2. 单次情景数量（3 / 4 / 5，默认 5）
 *   3. 支持等级（自动 / 多提示 / 标准 / 少提示）
 *   4. 清除练习记录（二次确认，只清进度、不动设置）
 *
 * 存储：全部走 settings.js 的内存状态，**不写 localStorage / sessionStorage**，
 * 因此刷新页面后设置会回到默认值（本阶段约定）。
 *
 * 措辞纪律：
 *   - 支持等级只对家长显示「多提示 / 标准 / 少提示」，绝不出现「简单/困难」。
 *   - 不出现「诊断」「治疗」「疗效」「得分」「能力值」。
 *   - 不收集任何身份信息。
 */

import { el } from './dom.js';
import {
  EXPRESSION_IDS,
  EXPRESSION_LABELS,
  MAX_SCENARIO_CHOICES,
  SUPPORT_CHOICES,
  clearProgress,
  getProgress,
  getSettings,
  isExpressionEnabled,
  setExpressionEnabled,
  setMaxScenarios,
  setSupportLevel,
} from '../settings.js';

/**
 * 「清除记录」的二次确认状态。放在模块级，因为点「清除」后我们会整页重绘，
 * 局部变量活不过重绘。
 *
 * @type {boolean}
 */
let pendingClearConfirm = false;

/** 进入家长角时调用，保证每次进来都是干净的初始态。 */
export function resetClearConfirm() {
  pendingClearConfirm = false;
}

/**
 * 建一行「开关」。
 *
 * @param {string} id 表情 id
 * @param {(path: string) => void} navigate
 * @returns {HTMLElement}
 */
function buildToggleRow(id, navigate) {
  const on = isExpressionEnabled(id);
  const label = EXPRESSION_LABELS[id];

  return el('div', { className: 'settings__row' }, [
    el('div', { className: 'settings__row-text' }, [
      el('span', { className: 'settings__row-title', text: label }),
      el('span', { className: 'settings__row-hint', text: on ? '已开启' : '已关闭' }),
    ]),
    el('button', {
      className: `toggle${on ? ' toggle--on' : ''}`,
      type: 'button',
      text: on ? '开' : '关',
      'aria-pressed': on ? 'true' : 'false',
      'aria-label': on ? `${label}：已开启，点击关闭` : `${label}：已关闭，点击开启`,
      onClick: () => {
        setExpressionEnabled(id, !on);
        navigate('/parent');
      },
    }),
  ]);
}

/**
 * 建一个分段选择器（用于单次情景数量与支持等级）。
 *
 * @param {ReadonlyArray<{value: any, label: string, hint?: string}>} choices
 * @param {any} current
 * @param {(value: any) => void} onPick
 * @returns {HTMLElement}
 */
function buildSegmented(choices, current, onPick) {
  return el(
    'div',
    { className: 'segmented', role: 'group' },
    choices.map((choice) =>
      el('button', {
        className: `segmented__btn${choice.value === current ? ' segmented__btn--active' : ''}`,
        type: 'button',
        text: choice.label,
        'aria-pressed': choice.value === current ? 'true' : 'false',
        ...(choice.hint === undefined ? {} : { title: choice.hint }),
        onClick: () => onPick(choice.value),
      }),
    ),
  );
}

/**
 * 建家长角页面。
 *
 * @param {object} options
 * @param {(path: string) => void} options.navigate
 * @returns {HTMLElement}
 */
export function createParentCornerView(options) {
  const { navigate } = options;
  const settings = getSettings();
  const progress = getProgress();

  /** 进度摘要；全部为 0 时用一句更自然的话。 */
  const progressText =
    progress.stars === 0 &&
    progress.completedScenarios === 0 &&
    progress.expressionCards === 0 &&
    progress.sessions === 0
      ? '还没有练习记录。做过练习后这里会显示星星和表情卡。'
      : `星星 ${progress.stars} 个 · 完成情景 ${progress.completedScenarios} 个 · 表情卡 ${progress.expressionCards} 张 · 练习 ${progress.sessions} 次`;

  /** 清除区：常态是一个按钮，点过之后变成二次确认。 */
  const clearArea = pendingClearConfirm
    ? el('div', { className: 'confirm' }, [
        el('p', {
          className: 'confirm__text',
          text: '确认清除练习记录吗？星星、表情卡和完成次数会归零，设置不变。',
        }),
        el('div', { className: 'confirm__actions' }, [
          el('button', {
            className: 'btn btn--danger',
            type: 'button',
            text: '确认清除',
            onClick: () => {
              clearProgress();
              pendingClearConfirm = false;
              navigate('/parent');
            },
          }),
          el('button', {
            className: 'btn btn--ghost',
            type: 'button',
            text: '取消',
            onClick: () => {
              pendingClearConfirm = false;
              navigate('/parent');
            },
          }),
        ]),
      ])
    : el('div', { className: 'settings__row settings__row--stack' }, [
        el('div', { className: 'settings__row-text' }, [
          el('span', { className: 'settings__row-title', text: '清除练习记录' }),
          el('span', { className: 'settings__row-hint', text: progressText }),
        ]),
        el('button', {
          className: 'btn btn--danger',
          type: 'button',
          text: '清除练习记录',
          onClick: () => {
            pendingClearConfirm = true;
            navigate('/parent');
          },
        }),
      ]);

  return el('section', { className: 'page page--parent' }, [
    el('h2', { className: 'page__heading', text: '家长角' }),
    el('p', {
      className: 'page__lead',
      text: '这些开关只给家长看，孩子端的页面里不会出现。',
    }),

    el('div', { className: 'settings' }, [
      // ---- 1. 表情开关 ----
      el('section', { className: 'settings__group' }, [
        el('h3', { className: 'settings__group-title', text: '表情开关' }),
        el('p', {
          className: 'settings__group-hint',
          text: '关掉的表情不会出现在情绪小镜子里，其他练习不受影响。',
        }),
        ...EXPRESSION_IDS.map((id) => buildToggleRow(id, navigate)),
      ]),

      // ---- 2. 单次情景数量 ----
      el('section', { className: 'settings__group' }, [
        el('h3', { className: 'settings__group-title', text: '单次最多几个情景' }),
        el('p', {
          className: 'settings__group-hint',
          text: '建议一次 3–5 个，不强迫做完；节奏由您决定。',
        }),
        buildSegmented(
          MAX_SCENARIO_CHOICES.map((n) => ({ value: n, label: `${n} 个` })),
          settings.maxScenarios,
          (value) => {
            setMaxScenarios(value);
            navigate('/parent');
          },
        ),
      ]),

      // ---- 3. 支持等级 ----
      el('section', { className: 'settings__group' }, [
        el('h3', { className: 'settings__group-title', text: '支持等级' }),
        el('p', {
          className: 'settings__group-hint',
          text: '这里只调整提示多少，不改变奖励，也不给孩子看「难度」。',
        }),
        buildSegmented(SUPPORT_CHOICES, settings.supportLevel, (value) => {
          setSupportLevel(value);
          navigate('/parent');
        }),
        el('p', {
          className: 'settings__group-note',
          text:
            settings.supportLevel === 'auto'
              ? '当前：自动。会按孩子的表现调整提示，连续失败时提示更早，连续成功时逐步减少。'
              : `当前：${SUPPORT_CHOICES.find((c) => c.value === settings.supportLevel)?.label ?? '标准'}。已由家长锁定，不再自动调整。`,
        }),
      ]),

      // ---- 4. 清除记录 ----
      el('section', { className: 'settings__group' }, [
        el('h3', { className: 'settings__group-title', text: '练习记录' }),
        el('p', {
          className: 'settings__group-hint',
          text: '只清星星、表情卡和完成次数；上面的设置会保留。',
        }),
        clearArea,
      ]),
    ]),

    // ---- 隐私与免责 ----
    el('section', { className: 'privacy' }, [
      el('h3', { className: 'privacy__title', text: '隐私说明' }),
      el('ul', { className: 'privacy__list' }, [
        el('li', { text: '摄像头只在您点击后申请；画面只在本机处理，不录像、不保存、不上传。' }),
        el('li', { text: '不收集姓名、生日、住址、学校、联系方式等身份信息。' }),
        el('li', { text: '不保存人脸或手部关键点，也不保存任何原始画面。' }),
        el('li', { text: '本阶段设置只保存在当前页面内存中，刷新页面会恢复默认值。' }),
      ]),
    ]),

    el('section', { className: 'privacy' }, [
      el('h3', { className: 'privacy__title', text: '非医疗免责声明' }),
      el('p', {
        className: 'privacy__body',
        text: '本应用是居家互动练习工具，不做医疗用途，不评估孩子的能力高低，不替代心理老师、医生或家长的专业判断，也不承诺任何效果。情景内容为示例，须经心理老师审核。',
      }),
      el('p', {
        className: 'privacy__body',
        text: '如果孩子出现抗拒、哭闹或明显不适，请立即停止练习。若您担心孩子的发育或情绪状况，请咨询专业人员。',
      }),
    ]),

    el('div', { className: 'page__actions' }, [
      el('button', {
        className: 'btn btn--primary btn--large',
        type: 'button',
        text: '回到主页',
        onClick: () => navigate('/home'),
      }),
    ]),
  ]);
}
