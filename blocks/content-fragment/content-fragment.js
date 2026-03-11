import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';
import { getHostname, mapAemPathToSitePath } from '../../scripts/utils.js';

function getApiGatewayUrl() {
  return getMetadata('api-gateway-url') || '';
}

function buildRequestConfig(isAuthor, aemauthorurl, aempublishurl, apiGatewayUrl, query, contentPath, variationname) { // eslint-disable-line max-len
  if (isAuthor) {
    return {
      url: `${aemauthorurl}${query};path=${contentPath};variation=${variationname};ts=${Date.now()}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
  }
  if (apiGatewayUrl) {
    return {
      url: apiGatewayUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graphQLPath: `${aempublishurl}${query}`,
        cfPath: contentPath,
        variation: `${variationname};ts=${Date.now()}`,
      }),
    };
  }
  return {
    url: `${aempublishurl}${query};path=${contentPath};variation=${variationname};ts=${Date.now()}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
}

function renderBanner(block, cfReq, {
  displayStyle, alignment, imgUrl, ctaHref,
}) {
  const banner = document.createElement('article');
  banner.className = 'cf-banner';
  if (displayStyle) banner.classList.add(displayStyle);
  if (alignment) banner.classList.add(alignment);
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', cfReq.title || 'Content highlight');

  const isLayoutVariant = ['image-left', 'image-right', 'image-top', 'image-bottom'].includes(displayStyle);

  if (!isLayoutVariant && imgUrl) {
    banner.style.backgroundImage = `linear-gradient(90deg, rgb(0 0 0 / 60%), rgb(0 0 0 / 10%) 80%), url(${imgUrl})`;
  }

  if (isLayoutVariant && imgUrl) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'cf-banner-image';
    imageDiv.setAttribute('role', 'img');
    imageDiv.setAttribute('aria-label', cfReq.title || 'Banner image');
    imageDiv.style.backgroundImage = `url(${imgUrl})`;
    banner.appendChild(imageDiv);
  }

  const content = document.createElement('div');
  content.className = 'cf-banner-content';

  if (cfReq.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.className = 'cf-banner-subtitle';
    subtitle.textContent = cfReq.subtitle;
    content.appendChild(subtitle);
  }

  if (cfReq.title) {
    const title = document.createElement('h2');
    title.className = 'cf-banner-title';
    title.textContent = cfReq.title;
    content.appendChild(title);
  }

  if (cfReq.description?.plaintext) {
    const desc = document.createElement('p');
    desc.className = 'cf-banner-description';
    desc.textContent = cfReq.description.plaintext;
    content.appendChild(desc);
  }

  if (ctaHref && ctaHref !== '#') {
    const cta = document.createElement('a');
    cta.className = 'cf-banner-cta button';
    cta.href = ctaHref;
    cta.textContent = cfReq.ctalabel || 'Learn More';
    cta.setAttribute('aria-label', `${cfReq.ctalabel || 'Learn More'} — ${cfReq.title || ''}`);
    content.appendChild(cta);
  }

  banner.appendChild(content);
  block.replaceChildren(banner);
}

export default async function decorate(block) {
  const GRAPHQL_QUERY = '/graphql/execute.json/premierinn-eds-xwalk/CTAByPath';
  const apiGatewayUrl = getApiGatewayUrl();

  const contentPath = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim();
  const variationname = block.querySelector(':scope div:nth-child(2) > div')?.textContent?.trim()?.toLowerCase()?.replace(' ', '_') || 'master';
  const displayStyle = block.querySelector(':scope div:nth-child(3) > div')?.textContent?.trim() || '';
  const alignment = block.querySelector(':scope div:nth-child(4) > div')?.textContent?.trim() || '';

  block.textContent = '';
  block.setAttribute('aria-busy', 'true');

  const observer = new IntersectionObserver(async (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    observer.disconnect();

    const hostnameFromPlaceholders = await getHostname();
    const hostname = hostnameFromPlaceholders || getMetadata('hostname');
    const aemauthorurl = getMetadata('authorurl') || '';
    const aempublishurl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');
    const isAuthor = isAuthorEnvironment();

    const requestConfig = buildRequestConfig(
      isAuthor,
      aemauthorurl,
      aempublishurl,
      apiGatewayUrl,
      GRAPHQL_QUERY,
      contentPath,
      variationname,
    );

    try {
      const response = await fetch(requestConfig.url, {
        method: requestConfig.method,
        headers: requestConfig.headers,
        ...(requestConfig.body && { body: requestConfig.body }),
      });

      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error(`Content Fragment GraphQL request failed: ${response.status}`);
        return;
      }

      const offer = await response.json();
      const cfReq = offer?.data?.ctaByPath?.item;
      if (!cfReq) return;

      // eslint-disable-next-line no-underscore-dangle
      const imgUrl = isAuthor ? cfReq.bannerimage?._authorUrl : cfReq.bannerimage?._publishUrl;

      let ctaHref = '#';
      if (cfReq?.ctaurl) {
        ctaHref = isAuthor ? cfReq.ctaurl : await mapAemPathToSitePath(cfReq.ctaurl);
      }

      renderBanner(block, cfReq, {
        displayStyle, alignment, imgUrl, ctaHref,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error rendering content fragment:', error);
    } finally {
      block.removeAttribute('aria-busy');
    }
  });

  observer.observe(block);
}
