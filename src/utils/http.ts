import { BASE_URL, BT_API_KEY_HEADER_NAME } from '~src/constants';

export const http = (() => {
  let _apiKey: string;

  const client = async (method: string, path: string, body?: unknown) => {
    if (!_apiKey) {
      throw Error('Missing api key');
    }

    return await fetch(`${BASE_URL}/3ds${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        [BT_API_KEY_HEADER_NAME]: _apiKey,
        'Content-Type': 'application/json',
      },
    });
  };

  const init = (apiKey: string) => {
    _apiKey = apiKey;
  };

  return {
    client,
    init,
  };
})();
