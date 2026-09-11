import {
  API_BASE_URL,
  BT_API_KEY_HEADER_NAME,
  BT_CORRELATION_ID_HEADER_NAME,
  REGIONAL_API_BASE_URLS,
} from '~src/constants';

/**
 * Resolves an override for the API base URL: an explicit `apiBaseUrl` first,
 * then a named region. Returns `undefined` when neither is given, which is how
 * an unconfigured caller falls through to `API_BASE_URL`
 * (https://api.basistheory.com) — the same host it has always used.
 *
 * Returning `undefined` rather than the default host matters: `_baseUrl` is what
 * marks a request as using an overridden URL, and always setting it would log
 * every default request as custom and emit an extra telemetry request.
 *
 * Region names are matched case-insensitively: a caller writing 'EU' means the
 * EU region, and quietly serving them the compatibility host is the mis-route a
 * region exists to prevent.
 */
const resolveApiBaseUrlOverride = (options?: {
  apiBaseUrl?: string;
  region?: string;
}): string | undefined => {
  if (options?.apiBaseUrl) {
    return options.apiBaseUrl;
  }

  const region = options?.region?.toLowerCase();

  return (region && REGIONAL_API_BASE_URLS[region]) || undefined;
};

export { resolveApiBaseUrlOverride };
import { logger } from './logging';

export const http = (() => {
  let _apiKey: string;
  let _baseUrl: string | undefined;

  const client = async (
    method: string,
    path: string,
    body?: unknown,
    correlationId?: string
  ) => {
    if (!_apiKey) {
      throw Error('Missing api key');
    }

    if (_baseUrl) {
      logger.log.info(`Using custom api base url in 3DS SDK ${_baseUrl}`);
    }

    const additional_headers: Record<string, string> = {};

    if (correlationId) {
      additional_headers[BT_CORRELATION_ID_HEADER_NAME] = correlationId;
    }

    return await fetch(`${_baseUrl ?? API_BASE_URL}/3ds${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        [BT_API_KEY_HEADER_NAME]: _apiKey,
        'Content-Type': 'application/json',
        ...additional_headers,
      },
    });
  };

  const init = (apiKey: string, baseUrl?: string) => {
    _apiKey = apiKey;
    _baseUrl = baseUrl;
  };

  return {
    client,
    init,
  };
})();
