import { loadFragment } from '../fragment/fragment.js';

export default function decorate(block) {
  block.setAttribute('aria-busy', 'true');

  const observer = new IntersectionObserver(async (entries) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      observer.disconnect();
      const container = block.querySelector('a[href]');
      if (!container) return;

      const { pathname } = new URL(container.href);
      const form = await loadFragment(pathname);
      if (form?.children?.[0]) {
        block.replaceChildren(form.children[0]);
      }
      block.removeAttribute('aria-busy');
    }
  });
  observer.observe(block);
}
