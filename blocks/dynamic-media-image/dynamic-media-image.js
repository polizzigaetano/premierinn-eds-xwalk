/**
 * Dynamic Media Image block.
 * Rendering is handled by the xWalk/Universal Editor infrastructure
 * via the custom-asset-namespace:custom-asset component.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const img = block.querySelector('img');
  if (img) {
    img.setAttribute('loading', 'lazy');
    if (!img.getAttribute('alt')) {
      img.setAttribute('alt', '');
    }
  }
}
