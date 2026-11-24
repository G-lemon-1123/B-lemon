/**
 * 极小 DOM 构建助手。
 *
 * 为什么自己写而不是用框架：AI-GUIDE-02 任务一明确「不引入 UI 框架」，
 * 而壳需要的就是「建节点、设属性、挂事件」三件事。
 *
 * 安全约定：本文件**不使用 innerHTML**。所有文本都走 textContent，
 * 避免以后把内容文件里的文案插进页面时带出注入问题。
 */

/** 事件监听器的值类型。 */
/** @typedef {(event: Event) => void} EventHandler */

/**
 * 创建一个元素。
 *
 * @param {string} tag 标签名，例如 'div' / 'button'
 * @param {Record<string, unknown>} [props] 属性；特殊键见下
 * @param {Array<Node | string | null | undefined>} [children] 子节点或文本
 * @returns {HTMLElement}
 *
 * props 里的特殊键：
 *   - `className`：class 字符串
 *   - `text`：textContent（优先于 children）
 *   - `dataset`：data-* 集合
 *   - `on<Event>`：事件监听，例如 `onClick`
 *   - 其余键：`aria-*`/`role` 等走 setAttribute，布尔属性走 property
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;

    if (key === 'className') {
      node.className = String(value);
      continue;
    }
    if (key === 'text') {
      node.textContent = String(value);
      continue;
    }
    if (key === 'dataset') {
      for (const [dataKey, dataValue] of Object.entries(/** @type {Record<string, unknown>} */ (value))) {
        if (dataValue === undefined || dataValue === null) continue;
        node.dataset[dataKey] = String(dataValue);
      }
      continue;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), /** @type {EventListener} */ (value));
      continue;
    }
    if (value === true) {
      node.setAttribute(key, '');
      continue;
    }
    if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
      node.setAttribute(key, String(value));
    }
  }

  if (props.text === undefined || props.text === null) {
    appendChildren(node, children);
  }

  return node;
}

/**
 * 挂子节点；`null`/`undefined` 直接跳过，方便写条件渲染。
 *
 * @param {Node} parent
 * @param {Array<Node | string | null | undefined>} children
 * @returns {Node} parent
 */
export function appendChildren(parent, children) {
  for (const child of children) {
    if (child === null || child === undefined) continue;
    parent.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return parent;
}

/**
 * 清空一个容器。
 *
 * @param {Node} node
 * @returns {void}
 */
export function clear(node) {
  while (node.firstChild !== null) {
    node.removeChild(node.firstChild);
  }
}
