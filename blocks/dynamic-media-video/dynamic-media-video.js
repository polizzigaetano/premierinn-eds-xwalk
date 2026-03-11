const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function parseDmVideoUrl(videoUrl) {
  const urnPattern = /(\/adobe\/assets\/urn:[^/]+)/i;
  const match = videoUrl.match(urnPattern);
  if (!match) return null;

  const videoURLObj = new URL(videoUrl);
  const baseUrl = `${videoURLObj.protocol}//${videoURLObj.hostname}`;
  const assetIdPath = match[1];

  return {
    posterImageUrl: `${baseUrl}${assetIdPath}/as/thumbnail.jpeg?preferwebp=true`,
    dashUrl: `${baseUrl}${assetIdPath}/manifest.mpd`,
    hlsUrl: `${baseUrl}${assetIdPath}/manifest.m3u8`,
  };
}

function renderNativeVideo(block, urls, options) {
  const videoEl = document.createElement('video');
  videoEl.poster = urls.posterImageUrl;
  videoEl.controls = true;
  videoEl.style.width = '100%';
  videoEl.style.maxWidth = '100%';
  videoEl.setAttribute('aria-label', 'Dynamic Media video');
  videoEl.preload = 'metadata';

  if (options.autoplay && !prefersReducedMotion.matches) videoEl.autoplay = true;
  if (options.loop) videoEl.loop = true;
  if (options.muted) videoEl.muted = true;

  const hlsSource = document.createElement('source');
  hlsSource.src = urls.hlsUrl;
  hlsSource.type = 'application/x-mpegURL';
  videoEl.appendChild(hlsSource);

  Array.from(block.children).forEach((child) => { child.style.display = 'none'; });
  block.appendChild(videoEl);
}

export default async function decorate(block) {
  const videolinks = block.querySelectorAll('a[href]');

  if (videolinks.length === 0) {
    Array.from(block.children).forEach((child) => { child.style.display = 'none'; });
    return;
  }

  const videoUrl = videolinks[0].href;
  const urls = parseDmVideoUrl(videoUrl);
  if (!urls) {
    // eslint-disable-next-line no-console
    console.error('Invalid Dynamic Media video URL format');
    return;
  }

  block.id = `dm-video-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const siblings = [];
  let current = block.nextElementSibling;
  while (current && siblings.length < 4) {
    siblings.push(current);
    current = current.nextElementSibling;
  }

  const consumeSiblingText = (el) => {
    if (!el) return '';
    const text = el.textContent?.trim() || '';
    if (text) el.remove();
    return text;
  };

  let autoplay = false;
  let loop = false;
  let muted = false;
  let showControls = true;

  if (siblings.length > 0) {
    autoplay = consumeSiblingText(siblings.shift()) === 'true';
    loop = consumeSiblingText(siblings.shift()) === 'true';
    muted = consumeSiblingText(siblings.shift()) === 'true';
    const controlsVal = consumeSiblingText(siblings.shift());
    showControls = controlsVal !== 'false';
  }

  if (prefersReducedMotion.matches) autoplay = false;

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    observer.disconnect();

    if (window.dmviewers?.VideoViewer) {
      const params = {
        posterimage: urls.posterImageUrl,
        sources: {},
      };
      if (urls.dashUrl) params.sources.DASH = urls.dashUrl;
      if (urls.hlsUrl) params.sources.HLS = urls.hlsUrl;

      Array.from(block.children).forEach((child) => { child.style.display = 'none'; });

      if (autoplay) params.autoplay = '1';
      if (loop) params.loop = '1';
      if (muted) params.muted = '1';
      if (!showControls) params.hidecontrolbar = '1';

      const s7videoviewer = new window.dmviewers.VideoViewer({
        containerId: block.id,
        params,
      });
      s7videoviewer.init();
    } else {
      renderNativeVideo(block, urls, { autoplay, loop, muted });
    }
  });

  observer.observe(block);
}
