import { BASE_URL, BT_API_KEY_HEADER_NAME, METHOD_REQUEST } from '@/constants';
import { getDeviceInfo } from '@/utils/browser';
import {
  createIframe,
  createForm,
  createInput,
  createElement,
} from '@/utils/dom';
import { encode } from '@/utils/encoding';

export interface Create3dsSessionRequest {
  pan: string;
}

export interface Create3dsSessionResponse {
  id: string;
  methodUrl?: string;
}

const sendMethodRequest = async (
  threeDSMethodURL: string,
  threeDSServerTransID: string,
  methodNotificationURL?: string
): Promise<any> => {
  const threeDSMethodDataBase64 = encode({
    threeDSServerTransID,
    threeDSMethodNotificationURL: methodNotificationURL,
  });

  const container = document.getElementById(METHOD_REQUEST.FRAME_CONTAINER_ID);

  const iframe = createIframe(
    container,
    METHOD_REQUEST.IFRAME_NAME,
    METHOD_REQUEST.IFRAME_NAME,
    '0',
    '0'
  );

  const form = createForm(METHOD_REQUEST.FORM_NAME, iframe.name);

  form.appendChild(
    createInput(METHOD_REQUEST.INPUT_NAME, threeDSMethodDataBase64)
  );

  const response = await new Promise(async (resolve, reject) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const fetchResponse = await fetch(threeDSMethodURL, {
          method: 'POST',
          body: new FormData(form),
        });

        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! Status: ${fetchResponse.status}`);
        }

        const responseBody = await fetchResponse.json();
        resolve(responseBody);
      } catch (error) {
        reject(error);
      }
    });

    iframe.appendChild(createElement('html', createElement('body', form)));

    form.submit();
  });

  return response;
};

const makeSessionRequest = async ({
  pan,
  apiKey,
}: Create3dsSessionRequest & {
  apiKey: string;
}): Promise<Create3dsSessionResponse> => {
  const deviceInfo = getDeviceInfo();

  const response = await fetch(`${BASE_URL}/3ds/session`, {
    method: 'POST',
    body: JSON.stringify({ pan, device: 'browser', deviceInfo }),
    headers: {
      [BT_API_KEY_HEADER_NAME]: apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  const data = await response.json();

  return data;
};

export const createSession =
  (apiKey: string) =>
  async ({ pan }: Create3dsSessionRequest) => {
    const session = await makeSessionRequest({ pan, apiKey });

    if (session.methodUrl) {
      return await sendMethodRequest(
        session.methodUrl,
        session.id,
        `${BASE_URL}/3ds/session/${session.id}/method'`
      );
    }

    return undefined;
  };
