import { API_BASE_URL, BT_API_KEY_HEADER_NAME, BT_CORRELATION_ID_HEADER_NAME } from '~src/constants';
import { logger } from './logging';

export const http = (() => {
  let _apiKey: string;
  let _baseUrl: string | undefined;

  const client = async (method: string, path: string, body?: unknown, correlationId?: string) => {
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
