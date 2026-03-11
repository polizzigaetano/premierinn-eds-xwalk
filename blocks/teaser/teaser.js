import {
  div, a, span, img, video, source, button, h2,
} from '../../scripts/dom-helpers.js';
import { readBlockConfig } from '../../scripts/aem.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function createVideoPlayer(block, videoSrc) {
  const pauseIcon = `${window.hlx.codeBasePath}/icons/video-pause.svg`;
  const playIcon = `${window.hlx.codeBasePath}/icons/video-play.svg`;
  const playId = `play-${block.dataset.blockName}-${Date.now()}`;
  const pauseId = `pause-${playId}`;
  const videoId = `video-${playId}`;

  const videoPlayer = div(
    { class: 'video-container' },
    div(
      {
        class: 'video-play',
        id: playId,
        tabindex: '0',
        role: 'button',
        'aria-label': 'Play video',
      },
      button(
        { class: 'video-play-btn', 'aria-hidden': 'true', tabindex: '-1' },
        img({
          class: 'play-icon controls', src: playIcon, width: '28', height: '28', alt: '',
        }),
      ),
    ),
    div(
      {
        class: 'video-pause inactive',
        id: pauseId,
        role: 'button',
        'aria-label': 'Pause video',
      },
      button(
        { class: 'video-pause-btn', 'aria-hidden': 'true', tabindex: '-1' },
        img({
          class: 'pause-icon controls', src: pauseIcon, width: '28', height: '28', alt: '',
        }),
      ),
    ),
    video(
      { id: videoId },
      source({ src: videoSrc, type: 'video/mp4' }),
    ),
  );

  const videoEl = videoPlayer.querySelector('video');
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.loop = true;
  videoEl.setAttribute('aria-hidden', 'true');

  return {
    videoPlayer, playId, pauseId, videoId,
  };
}

function createBackgroundImage(properties) {
  const missingSrc = !properties.imageref;
  const imgSrc = !missingSrc ? properties.imageref : '';
  const imgAlt = properties.imagealt || '';
  const imgBackground = div(
    { class: 'background-image' },
    img({
      class: 'teaser-background',
      src: imgSrc,
      alt: imgAlt,
      loading: 'lazy',
    }),
  );
  if (missingSrc) imgBackground.classList.add('inactive');
  return imgBackground;
}

function observeVideo(block, autoplay, videoId, playId, pauseId) {
  const videoPlayerEl = block.querySelector(`#${videoId}`);
  if (!videoPlayerEl) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!prefersReducedMotion.matches && autoplay && videoPlayerEl.dataset.state !== 'pause') {
          const playButton = block.querySelector(`#${playId}`);
          const pauseButton = block.querySelector(`#${pauseId}`);
          playButton.classList.add('inactive');
          playButton.removeAttribute('tabindex');
          pauseButton.classList.remove('inactive');
          pauseButton.setAttribute('tabindex', '0');
          videoPlayerEl.play();
        }
      } else {
        videoPlayerEl.pause();
      }
    });
  }, { threshold: 0.5 });
  observer.observe(videoPlayerEl);
}

function attachListeners(block, videoId, playId, pauseId) {
  const videoPlayer = block.querySelector(`#${videoId}`);
  const playBtn = block.querySelector(`#${playId}`);
  const pauseBtn = block.querySelector(`#${pauseId}`);
  if (!videoPlayer || !playBtn || !pauseBtn) return;

  const play = () => {
    playBtn.classList.add('inactive');
    playBtn.removeAttribute('tabindex');
    pauseBtn.classList.remove('inactive');
    pauseBtn.setAttribute('tabindex', '0');
    videoPlayer.autoplay = true;
    videoPlayer.dataset.state = 'play';
    videoPlayer.play();
    pauseBtn.focus();
  };

  const pause = () => {
    playBtn.classList.remove('inactive');
    playBtn.setAttribute('tabindex', '0');
    pauseBtn.classList.add('inactive');
    pauseBtn.removeAttribute('tabindex');
    videoPlayer.autoplay = false;
    videoPlayer.dataset.state = 'pause';
    videoPlayer.pause();
    playBtn.focus();
  };

  playBtn.addEventListener('click', play);
  playBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
  pauseBtn.addEventListener('click', pause);
  pauseBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pause(); } });
}

export default function decorate(block) {
  const rteElementTag = Array.from(block.querySelectorAll('p'))
    .find((el) => el.textContent.trim() === 'title');
  const rteElement = rteElementTag?.parentElement?.nextElementSibling;
  const rteNode = rteElement?.querySelector('p');

  const properties = readBlockConfig(block);

  let swooshbgClass = 'swoosh-bg';
  let swooshlayersClass = 'swoosh-layers';

  if (properties.useswoosh && properties.useswoosh === 'false') {
    swooshbgClass = 'swoosh-bg-hidden';
    swooshlayersClass = 'swoosh-layers-hidden';
  }

  let buttonContainerClass = 'button-container';
  if (properties.ctastyle) {
    buttonContainerClass = `cta-${properties.ctastyle}`;
  }

  const swooshFirst = `${window.hlx.codeBasePath}/icons/teaser_innerswoosh.svg`;
  const swooshSecond = `${window.hlx.codeBasePath}/icons/teaser_outerswoosh.svg`;
  const isVideo = properties.teaserstyle === 'video';
  const videoAutoplay = properties.videobehavior === 'autoplay';
  const buttonText = properties.buttontext || 'Button';
  const buttonStyle = properties['btn-style'] || 'dark-bg';
  const buttonLink = properties['btn-link'] || '';
  const sampleVideo = 'https://v.ftcdn.net/02/35/97/40/700_F_235974059_oVftmgBBJ32tgsDvxRdMdtpQDMfNFWEt_ST.mp4';
  const videoReference = isVideo && properties.videoreference
    ? properties.videoreference : sampleVideo;

  let videoData = null;
  let mediaElement;
  if (isVideo) {
    videoData = createVideoPlayer(block, videoReference);
    mediaElement = videoData.videoPlayer;
  } else {
    mediaElement = createBackgroundImage(properties);
  }

  const titleEl = h2({ class: 'teaser-title' });
  if (rteNode && properties.title) {
    titleEl.append(...Array.from(rteNode.childNodes).map((n) => n.cloneNode(true)));
  } else {
    titleEl.textContent = 'Title';
  }

  const teaser = div(
    {
      class: 'teaser-container',
      role: 'banner',
      'aria-label': titleEl.textContent || 'Teaser',
    },
    mediaElement,
    div(
      { class: 'teaser-swoosh-wrapper' },
      div({ class: swooshbgClass, 'aria-hidden': 'true' }),
      div(
        { class: swooshlayersClass, 'aria-hidden': 'true' },
        img({
          class: 'swoosh first', src: swooshFirst, alt: '', loading: 'lazy',
        }),
        img({
          class: 'swoosh second', src: swooshSecond, alt: '', loading: 'lazy',
        }),
      ),
      div(
        { class: 'teaser-title-wrapper' },
        titleEl,
        div(
          { class: buttonContainerClass },
          a(
            { href: buttonLink, class: `button ${buttonStyle}`, 'aria-label': buttonText },
            span({ class: 'button-text' }, buttonText),
          ),
        ),
      ),
    ),
  );

  block.replaceChildren(teaser);

  if (isVideo && videoData) {
    observeVideo(block, videoAutoplay, videoData.videoId, videoData.playId, videoData.pauseId);
    attachListeners(block, videoData.videoId, videoData.playId, videoData.pauseId);
  }
}
