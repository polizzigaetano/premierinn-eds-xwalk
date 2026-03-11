import { getMetadata } from './aem.js';

/**
 * Detects if the current environment is an AEM author instance.
 * @returns {boolean}
 */
export function isAuthorEnvironment() {
  try {
    return typeof window !== 'undefined'
      && /(^|\.)author[-.]/.test(window.location.hostname);
  } catch (_) {
    return false;
  }
}

/**
 * Gets the AEM hostname from page metadata.
 * Falls back to the 'hostname' meta tag if placeholders are not available.
 * @returns {Promise<string>}
 */
export async function getHostname() {
  try {
    const hostname = getMetadata('hostname');
    return hostname || '';
  } catch (_) {
    return '';
  }
}

/**
 * Maps an AEM content path to a site-relative path using paths.json mappings.
 * @param {string} aemPath - The AEM content path (e.g. /content/site/page)
 * @returns {Promise<string>} The site path (e.g. /page)
 */
export async function mapAemPathToSitePath(aemPath) {
  if (!aemPath) return aemPath;
  try {
    const resp = await fetch('/paths.json');
    if (resp.ok) {
      const pathsConfig = await resp.json();
      const mappings = pathsConfig?.mappings || [];
      const match = mappings.find((mapping) => {
        const [from] = mapping.split(':');
        return aemPath.startsWith(from);
      });
      if (match) {
        const [from, to] = match.split(':');
        return aemPath.replace(from, to);
      }
    }
  } catch (_) {
    // fall through
  }
  return aemPath;
}

/**
 * Gets the Dynamic Media server URL from page metadata.
 * Authors can configure this via the 'dm-server-url' metadata property.
 * @returns {Promise<string>}
 */
export async function getDynamicMediaServerURL() {
  const dmUrl = getMetadata('dm-server-url');
  return dmUrl || '';
}
