/**
 * 极简 hash 路由：只负责「路径 → 页面节点」的映射，以及前进/后退。
 *
 * 为什么用 hash（`#/home`）而不是 History API：
 *   - 零依赖、纯静态托管即可运行，刷新或直接分享链接不会 404；
 *   - 平板浏览器/家长的返回手势天然可用，不用自己造历史。
 *
 * 为什么自己维护一份栈：顶部栏的「返回」要能区分
 *   「应用内还有上一页」和「已经到第一页了」，后者应禁用而不是跳出应用。
 */

/** 默认落地路由。 */
export const DEFAULT_PATH = '/welcome';

/**
 * 渲染一个页面时拿到的上下文。
 *
 * @typedef {object} RouteContext
 * @property {string} path 当前路径（已归一化，例如 '/home'）
 * @property {(path: string) => void} navigate 跳到另一个路由
 * @property {() => void} back 返回上一页（无上一页时不动）
 *
 * @typedef {object} Route
 * @property {string} id 路由标识
 * @property {string} path 路径，例如 '/home'
 * @property {string} title 顶部栏与 document.title 用
 * @property {(ctx: RouteContext) => Node} render 渲染页面内容
 * @property {boolean} [showBack] 是否显示顶部栏返回按钮，默认 true
 *
 * @typedef {object} Router
 * @property {(path: string, options?: { replace?: boolean }) => void} navigate
 * @property {() => boolean} back 返回上一页；返回是否真的动了
 * @property {() => boolean} canGoBack
 * @property {() => Route} current
 * @property {() => void} start 开始监听 hash 变化
 * @property {() => void} stop 停止监听
 * @property {(listener: (route: Route, ctx: RouteContext) => void) => () => void} subscribe
 */

/**
 * 把任意 hash 归一化成以 `/` 开头的路径。
 *
 * @param {string} hash 形如 '' / '#/' / '#/home?x=1'
 * @returns {string}
 */
export function normalizeHash(hash) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const withoutQuery = raw.split('?')[0] ?? '';
  const trimmed = withoutQuery.trim();
  if (trimmed === '' || trimmed === '/') return DEFAULT_PATH;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * 创建路由器。
 *
 * @param {Route[]} routes
 * @param {{ defaultPath?: string; notFound?: (ctx: RouteContext) => Node }} [options]
 * @returns {Router}
 */
export function createRouter(routes, options = {}) {
  const defaultPath = options.defaultPath ?? DEFAULT_PATH;
  const fallback = options.notFound ?? (() => document.createTextNode('页面不存在'));

  /** @type {Route[]} */
  const stack = [];
  /** @type {Array<(route: Route, ctx: RouteContext) => void>} */
  const listeners = [];
  let started = false;

  /**
   * @param {string} path
   * @returns {Route | null}
   */
  const findRoute = (path) => routes.find((route) => route.path === path) ?? null;

  /**
   * @param {string} path
   * @returns {Route}
   */
  const resolveRoute = (path) =>
    findRoute(path) ?? {
      id: 'not-found',
      path,
      title: '找不到页面',
      render: fallback,
    };

  const ctx = /** @type {RouteContext} */ ({
    path: defaultPath,
    navigate: (path) => router.navigate(path),
    back: () => {
      router.back();
    },
  });

  /** 读取地址栏当前路径。 */
  const readPath = () => normalizeHash(window.location.hash);

  /** 顶部栏返回是否可用：栈里至少两个条目。 */
  const canGoBack = () => stack.length > 1;

  /** 真正把页面渲染出来。 */
  const emit = () => {
    const path = readPath();
    const route = resolveRoute(path);
    const known = findRoute(path) !== null;

    // 路由栈：正常前进压栈；未知路径替换栈顶，避免返回时在坏链接里打转。
    if (stack.length === 0) {
      stack.push(route);
    } else if (known) {
      const top = stack[stack.length - 1];
      if (top === undefined || top.path !== route.path) {
        stack.push(route);
      }
    } else {
      stack[stack.length - 1] = route;
    }

    ctx.path = route.path;
    for (const listener of listeners) {
      listener(route, ctx);
    }
  };

  /** @type {Router} */
  const router = {
    navigate(path, navigateOptions = {}) {
      const target = path.startsWith('/') ? path : `/${path}`;
      const nextHash = `#${target}`;
      if (window.location.hash === nextHash) {
        emit();
        return;
      }
      if (navigateOptions.replace === true) {
        const url = `${window.location.pathname}${window.location.search}${nextHash}`;
        window.history.replaceState(null, '', url);
        emit();
        return;
      }
      window.location.hash = nextHash;
    },

    back() {
      if (stack.length > 1) {
        stack.pop();
        const previous = stack[stack.length - 1];
        if (previous !== undefined && previous.path === readPath()) {
          // 目标就是当前地址（例如用户手动改过 hash），直接重渲染。
          emit();
          return true;
        }
        if (previous !== undefined) {
          window.location.hash = `#${previous.path}`;
          return true;
        }
      }
      // 没有应用内上一页：不要跳出应用，改为回到主页。
      if (readPath() !== defaultPath) {
        router.navigate(defaultPath, { replace: true });
        return true;
      }
      return false;
    },

    canGoBack,
    current() {
      const top = stack[stack.length - 1];
      return top ?? resolveRoute(readPath());
    },
    start() {
      if (started) return;
      started = true;
      window.addEventListener('hashchange', emit);
      if (window.location.hash === '' || window.location.hash === '#') {
        router.navigate(defaultPath, { replace: true });
      } else {
        emit();
      }
    },
    stop() {
      if (!started) return;
      started = false;
      window.removeEventListener('hashchange', emit);
    },
    subscribe(listener) {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
  };

  return router;
}
