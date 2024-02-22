import { METHOD_REQUEST } from '~src/constants';
import { getDeviceInfo } from '~src/utils/browser';
import {
  createIframe,
  createForm,
  createInput,
  createElement,
} from '~src/utils/dom';
import { camelCaseToSnakeCase, snakeCaseToCamelCase } from '~src/utils/casing';
import { encode } from '~src/utils/encoding';
import { handleThreeDSRequest } from './handlers/handleThreeDSRequest';
import { http } from '~src/utils/http';
import { logger } from '~src/utils/logging';
import { Notification, NotificationType } from '~src/utils/events';
export interface Create3dsSessionRequest {
  pan: string;
}

export type Create3dsSessionResponse = {
  id: string;
  method_url?: string;
  method_notification_url?: string;
};

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

  const response = await http.client(
    'POST',
    `/sessions`,
    camelCaseToSnakeCase({
      pan,
      device: 'browser',
      deviceInfo,
    })
  );

  if (!response.ok) {
    const msg = `HTTP error! Status: ${response.status}`;

    logger.log.error(msg);

    throw new Error(msg);
  }

  const session = snakeCaseToCamelCase<Create3dsSessionResponse>(
    (await response.json()) as Create3dsSessionResponse
  );

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

export const createSession = handleThreeDSRequest<
  Create3dsSessionRequest,
  Create3dsSessionResponse
>(makeSessionRequest);
