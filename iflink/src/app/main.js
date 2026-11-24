/**
 * 应用壳装配：把路由、顶部栏和页面容器拼起来并挂到 `#app`。
 *
 * 职责边界（按 docs/AI-GUIDE-02-shell.md）：
 *   - 本文件只做「页面结构 + 路由」，不接真实摄像头、模型、情景选择。
 *   - 不调用 getUserMedia：摄像头只允许由用户点击后、在对应模块内部申请。
 *   - 静音只维护一个布尔状态并对外广播；音效实现属于成员 E。
 */

import { createTopBar } from './components/topbar.js';
import { clear } from './components/dom.js';
import { createBreakHandler, createRoutes } from './routes.js';
import { createRouter } from './router.js';

/**
 * 壳对外暴露的最小接口，供 demo 页面与后续任务扩展。
 *
 * @typedef {object} ShellApp
 * @property {import('./router.js').Router} router
 * @property {() => boolean} isMuted
 * @property {(muted: boolean) => void} setMuted
 * @property {(listener: (muted: boolean) => void) => () => void} onMuteChange
 * @property {() => void} destroy
 */

/**
 * 创建并启动应用壳。
 *
 * @param {object} [options]
 * @param {HTMLElement} [options.root] 挂载点；默认取 `#app`
 * @returns {ShellApp}
 */
export function createApp(options = {}) {
  const root = options.root ?? document.getElementById('app');
  if (root === null) {
    throw new Error('找不到挂载点 #app，请检查页面 HTML。');
  }

  /** @type {boolean} */
  let muted = false;
  /** @type {Array<(muted: boolean) => void>} */
  const muteListeners = [];

  const router = createRouter(createRoutes({ onBreak: () => {} }));

  // 页面容器：每次切换路由时整块替换，避免上一页的监听器残留。
  const main = document.createElement('main');
  main.className = 'app__main';
  main.id = 'main';

  const shell = document.createElement('div');
  shell.className = 'app';
  root.appendChild(shell);

  let currentTitle = '';

  const renderShell = (route, canGoBack) => {
    clear(shell);

    if (route.showBack !== false) {
      shell.appendChild(
        createTopBar({
          title: route.title,
          canGoBack,
          onBack: () => {
            router.back();
          },
          onBreak: createBreakHandler(router),
          muted,
          onToggleMute: () => {
            app.setMuted(!muted);
          },
        }),
      );
    }

    shell.appendChild(main);

    if (currentTitle !== route.title) {
      currentTitle = route.title;
      document.title = `${route.title}｜小步星球`;
    }
  };

  const unsubscribe = router.subscribe((route, ctx) => {
    renderShell(route, router.canGoBack());
    clear(main);
    const view = route.render(ctx);
    main.appendChild(view);

    // 切页后把焦点移到主区域，键盘与读屏用户不用重新找起点。
    if (typeof main.focus === 'function') {
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
    }
  });

  /** @type {ShellApp} */
  const app = {
    router,
    isMuted: () => muted,
    setMuted(next) {
      const value = next === true;
      if (value === muted) return;
      muted = value;
      for (const listener of muteListeners) listener(muted);
      // 立即用新状态重绘顶部栏；不动页面内容，避免打断正在进行的交互。
      renderShell(router.current(), router.canGoBack());
    },
    onMuteChange(listener) {
      muteListeners.push(listener);
      return () => {
        const index = muteListeners.indexOf(listener);
        if (index >= 0) muteListeners.splice(index, 1);
      };
    },
    destroy() {
      unsubscribe();
      router.stop();
      clear(shell);
      if (shell.parentNode !== null) shell.parentNode.removeChild(shell);
    },
  };

  router.start();
  return app;
}

// 作为脚本直接引入时自动启动；被 import 时由调用方决定时机。
if (typeof document !== 'undefined' && document.getElementById('app') !== null) {
  const start = () => {
    try {
      window.__shellApp = createApp();
    } catch (error) {
      const root = document.getElementById('app');
      if (root !== null) {
        const message = error instanceof Error ? error.message : String(error);
        root.textContent = `应用壳启动失败：${message}`;
      }
      throw error;
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}

export default createApp;
