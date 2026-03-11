import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';
import { getHostname } from '../../scripts/utils.js';

function getApiGatewayUrl() {
  return getMetadata('api-gateway-url') || '';
}

function parseVariableMappings(variablemapping) {
  const paramObject = {};
  if (!variablemapping) return paramObject;

  variablemapping.split(',').forEach((pair) => {
    const indexOfEqual = pair.indexOf('=');
    if (indexOfEqual !== -1) {
      const key = pair.slice(0, indexOfEqual).trim();
      let value = pair.slice(indexOfEqual + 1).trim();
      if (value.endsWith(',')) value = value.slice(0, -1);
      if (key) paramObject[key] = value;
    }
  });
  return paramObject;
}

function renderTemplateImage(block, finalUrl) {
  const finalImg = document.createElement('img');
  finalImg.className = 'dm-template-image';
  finalImg.src = finalUrl;
  finalImg.alt = 'Dynamic Media template';
  finalImg.loading = 'lazy';
  block.replaceChildren(finalImg);
}

function buildTemplateUrl(templateURL, paramObject) {
  const queryString = Object.entries(paramObject)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return templateURL.includes('?')
    ? `${templateURL}&${queryString}`
    : `${templateURL}?${queryString}`;
}

export default async function decorate(block) {
  const inputs = block.querySelectorAll('.dynamicmedia-template > div');
  const configSrc = Array.from(block.children)[0]?.textContent?.trim();

  if (configSrc === 'inline' || !configSrc) {
    const templateURL = inputs[1]?.textContent?.trim();
    const variablemapping = inputs[2]?.textContent?.trim();

    if (!templateURL) {
      // eslint-disable-next-line no-console
      console.error('DynamicMedia Template: missing template URL');
      block.textContent = '';
      return;
    }

    const paramObject = parseVariableMappings(variablemapping);
    const finalUrl = buildTemplateUrl(templateURL, paramObject);
    renderTemplateImage(block, finalUrl);
    return;
  }

  if (configSrc === 'cf') {
    const GRAPHQL_QUERY = '/graphql/execute.json/premierinn-eds-xwalk/DynamicMediaTemplateByPath';
    const apiGatewayUrl = getApiGatewayUrl();

    const hostnameFromPlaceholders = await getHostname();
    const hostname = hostnameFromPlaceholders || getMetadata('hostname');
    const aemauthorurl = getMetadata('authorurl') || '';
    const aempublishurl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');

    const contentPath = block.querySelector('p.button-container > a')?.textContent?.trim();
    const isAuthor = isAuthorEnvironment();

    let requestConfig;
    if (isAuthor) {
      requestConfig = {
        url: `${aemauthorurl}${GRAPHQL_QUERY};path=${contentPath};ts=${Date.now()}`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      };
    } else if (apiGatewayUrl) {
      requestConfig = {
        url: apiGatewayUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphQLPath: `${aempublishurl}${GRAPHQL_QUERY}`,
          cfPath: contentPath,
          variation: `master;ts=${Date.now()}`,
        }),
      };
    } else {
      requestConfig = {
        url: `${aempublishurl}${GRAPHQL_QUERY};path=${contentPath};ts=${Date.now()}`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      };
    }

    try {
      const response = await fetch(requestConfig.url, {
        method: requestConfig.method,
        headers: requestConfig.headers,
        ...(requestConfig.body && { body: requestConfig.body }),
      });

      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error(`DynamicMedia Template CF request failed: ${response.status}`);
        block.textContent = '';
        return;
      }

      const offer = await response.json();
      const templateURL = offer?.data?.dynamicMediaTemplateByPath?.item?.dm_template;
      const paramPairs = offer?.data?.dynamicMediaTemplateByPath?.item?.var_mapping;

      if (!templateURL) {
        block.textContent = '';
        return;
      }

      const paramObject = {};
      if (paramPairs && Array.isArray(paramPairs)) {
        paramPairs.forEach((pair) => {
          const indexOfEqual = pair.indexOf('=');
          if (indexOfEqual !== -1) {
            const key = pair.slice(0, indexOfEqual).trim();
            let value = pair.slice(indexOfEqual + 1).trim();
            if (value.endsWith(',')) value = value.slice(0, -1);
            paramObject[key] = value;
          }
        });
      }

      const finalUrl = buildTemplateUrl(templateURL, paramObject);
      renderTemplateImage(block, finalUrl);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error rendering DynamicMedia Template:', error);
      block.textContent = '';
    }
  }
}
