import { METHOD_REQUEST } from '~src/constants';
import { getDeviceInfo } from '~src/utils/browser';
import {
  createIframe,
  createForm,
  createInput,
  createElement,
} from '~src/utils/dom';
import { encode } from '~src/utils/encoding';
import { http } from '~src/utils/http';
import {
  Notification,
  NotificationType,
  isNotification,
} from '~src/utils/events';
import { logger } from './utils/logging';
export interface Create3dsSessionRequest {
  pan: string;
}

export interface Create3dsSessionResponse {
  id: string;
  methodUrl?: string;
  methodNotificationUrl?: string;
}

const submitMethodRequest = (
  threeDSMethodURL: string,
  threeDSServerTransID: string,
  methodNotificationURL?: string
): void => {
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

  const form = createForm(
    METHOD_REQUEST.FORM_NAME,
    threeDSMethodURL,
    iframe.name
  );

  form.appendChild(
    createInput(METHOD_REQUEST.INPUT_NAME, threeDSMethodDataBase64)
  );

  iframe.appendChild(createElement('html', createElement('body', form)));

  form.submit();
};

const makeSessionRequest = async ({
  pan,
}: Create3dsSessionRequest): Promise<Create3dsSessionResponse> => {
  const deviceInfo = getDeviceInfo();

  const response = await http.client('POST', `/sessions`, {
    pan,
    device: 'browser',
    deviceInfo,
  });

  if (!response.ok) {
    const msg = `HTTP error! Status: ${response.status}`;

    logger.log.error(msg);

    throw new Error(msg);
  }

  const session = (await response.json()) as Create3dsSessionResponse;

  logger.log.info(`3DS session response received with ID ${session.id}`);

  setTimeout(() => {
    const msg: Notification = {
      isCompleted: false,
      id: session.id,
      type: NotificationType.METHOD_TIME_OUT,
    };

    window.postMessage(msg, '*');
  }, 10000);

  if (session.methodUrl) {
    submitMethodRequest(
      session.methodUrl,
      session.id,
      session.methodNotificationUrl
    );
  }

  return session;
};

export const createSession = async ({ pan }: Create3dsSessionRequest) =>
  new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<Notification>) => {
      if (isNotification(event.data)) {
        window.removeEventListener('message', handleMessage);

        const id = event.data.id;

        logger.log.info(
          `${event.data.type} notification received for session: ${id}`
        );

        resolve({ id });
      } else if (event.isTrusted == false) {
        // discard untrusted events
      } else {
        reject('Something happened, please try again.');
      }
    };

    window.addEventListener('message', handleMessage);

    makeSessionRequest({ pan }).catch((error) => {
      window.removeEventListener('message', handleMessage);
      reject(error);
    });
  });
