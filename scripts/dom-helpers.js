/**
 * Helper for creating DOM elements with attributes and children.
 * @param {string} tag - HTML tag name
 * @param {Object} [attributes] - Element attributes
 * @param {...(Node|string)} children - Child nodes or text
 * @returns {HTMLElement}
 */
function domEl(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class') {
        element.className = value;
      } else if (typeof value === 'boolean') {
        if (value) element.setAttribute(key, '');
      } else {
        element.setAttribute(key, value);
      }
    });
  }
  children.forEach((child) => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  return element;
}

export const div = (attrs, ...children) => domEl('div', attrs, ...children);
export const a = (attrs, ...children) => domEl('a', attrs, ...children);
export const span = (attrs, ...children) => domEl('span', attrs, ...children);
export const img = (attrs, ...children) => domEl('img', attrs, ...children);
export const video = (attrs, ...children) => domEl('video', attrs, ...children);
export const source = (attrs, ...children) => domEl('source', attrs, ...children);
export const button = (attrs, ...children) => domEl('button', attrs, ...children);
export const h2 = (attrs, ...children) => domEl('h2', attrs, ...children);
export const p = (attrs, ...children) => domEl('p', attrs, ...children);
export const ul = (attrs, ...children) => domEl('ul', attrs, ...children);
export const li = (attrs, ...children) => domEl('li', attrs, ...children);

export default domEl;
