const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export class InsecureUrlError extends Error {}

function isLoopback(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname) || /^127(\.\d{1,3}){3}$/.test(hostname);
}

/**
 * Parses the SQL Vault base URL. HTTPS is required for every host except
 * loopback, so the API key is never sent in clear text over the network.
 */
export function parseApiUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new InsecureUrlError(`Invalid SQL Vault URL: ${raw}`);
  }

  if (url.protocol === 'https:') return url;
  if (url.protocol === 'http:' && isLoopback(url.hostname)) return url;

  throw new InsecureUrlError(
    `Refusing to send the API key to ${url.origin}: use https:// (plain http is only allowed for localhost).`
  );
}
