const loadEmbed = (block, link) => {
  if (block.classList.contains('embed-is-loaded')) return;

  const url = new URL(link);
  const iframe = document.createElement('iframe');
  iframe.src = url.href;
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('allow', 'encrypted-media');
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', `Embedded content from ${url.hostname}`);
  iframe.style.cssText = 'border: 0; width: 100%; height: 100%;';

  block.replaceChildren(iframe);
  block.classList.add('embed-is-loaded');
};

export default function decorate(block) {
  const props = [...block.children].map((row) => row.firstElementChild);
  const appUrl = props[0]?.textContent?.trim();
  if (!appUrl) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      loadEmbed(block, appUrl);
    }
  });
  observer.observe(block);
}
