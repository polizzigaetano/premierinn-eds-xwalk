import { getDynamicMediaServerURL } from '../../scripts/utils.js';

export default async function decorate(block) {
  const deliveryType = Array.from(block.children)[0]?.textContent?.trim();
  const inputs = block.querySelectorAll('.dynamicmedia-image > div');
  const inputsArray = Array.from(inputs);

  if (inputsArray.length < 2) {
    // eslint-disable-next-line no-console
    console.log('DynamicMedia Image: missing inputs, expecting at least 2');
    return;
  }

  const imageEl = inputs[1]?.getElementsByTagName('img')[0];
  const rotate = inputs[2]?.textContent?.trim();
  const flip = inputs[3]?.textContent?.trim();
  const crop = inputs[4]?.textContent?.trim();
  const altText = inputs[5]?.textContent?.trim();

  if (deliveryType === 'na' || !deliveryType) {
    block.textContent = '';
    return;
  }

  if (deliveryType === 'dm') {
    const dmUrl = await getDynamicMediaServerURL();

    if (typeof window.s7responsiveImage !== 'function') {
      if (imageEl) {
        imageEl.setAttribute('alt', altText || '');
        imageEl.setAttribute('loading', 'lazy');
        block.replaceChildren(imageEl);
      }
      return;
    }

    if (!imageEl) return;
    const imageSrc = imageEl.getAttribute('src');
    if (!imageSrc) return;

    const [imageName] = imageSrc.split('/').pop().split('.');
    const serverUrl = dmUrl || '';

    if (serverUrl) {
      const sep = serverUrl.endsWith('/') ? '' : '/';
      imageEl.setAttribute('data-src', `${serverUrl}${sep}${imageName}`);
      imageEl.setAttribute('src', `${serverUrl}${sep}${imageName}`);
    }

    imageEl.setAttribute('alt', altText || '');
    imageEl.setAttribute('loading', 'lazy');
    imageEl.setAttribute('data-mode', 'smartcrop');
    block.replaceChildren(imageEl);
    window.s7responsiveImage(imageEl);
    return;
  }

  if (deliveryType === 'dm-openapi') {
    const assetLink = inputs[1]?.querySelector('a[href]');
    let baseUrl = assetLink?.href?.split('?')[0];

    if (!baseUrl) {
      const sourceEl = inputs[1]?.querySelector('picture source[srcset]');
      const srcset = sourceEl?.getAttribute('srcset') || '';
      if (srcset) {
        const [firstSrc] = srcset.split(',');
        [baseUrl] = firstSrc.trim().split('?');
      }
    }

    if (!baseUrl) {
      const imgEl = inputs[1]?.querySelector('picture img[src], img[src]');
      const imgSrc = imgEl?.getAttribute('src') || '';
      if (imgSrc) [baseUrl] = imgSrc.split('?');
    }

    if (!baseUrl) {
      // eslint-disable-next-line no-console
      console.error('DynamicMedia Image OpenAPI: delivery URL not found');
      return;
    }

    const params = new URLSearchParams();
    params.set('width', '1400');
    params.set('quality', '85');
    if (rotate && rotate.toLowerCase() !== 'none') params.set('rotate', rotate);
    if (flip) params.set('flip', flip.toLowerCase());
    if (crop) params.set('crop', crop.toLowerCase());

    const finalUrl = `${baseUrl}?${params.toString()}`;

    const img = document.createElement('img');
    img.setAttribute('src', finalUrl);
    img.setAttribute('alt', altText || '');
    img.setAttribute('loading', 'lazy');

    block.replaceChildren(img);
  }
}
