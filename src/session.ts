import { METHOD_REQUEST } from '~src/constants';
import { getDeviceInfo } from '~src/utils/browser';
import {
  createIframe,
  createForm,
  createInput,
  createElement,
} from '~src/utils/dom';
import {
  DeepTransformKeysCase,
  camelCaseToSnakeCase,
  snakeCaseToCamelCase,
} from '~src/utils/casing';
import { encode } from '~src/utils/encoding';
import { http } from '~src/utils/http';
import { logger } from '~src/utils/logging';
import { NotificationType, notify } from '~src/utils/events';
import { handleCreateSession } from './handlers/handleCreateSession';
import { isApiError, processApiError } from './utils/errors';
export interface Create3dsSessionRequest {
  tokenId?: string;
  tokenIntentId?: string;
  /**
   * @deprecated This property is deprecated in favor of `tokenId`
   */
  pan?: string;
}

export type Create3dsSessionResponse = {
  id: string;
  cardBrand?: string;
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
  tokenId,
  tokenIntentId,
  pan,
}: Create3dsSessionRequest): Promise<
  DeepTransformKeysCase<Create3dsSessionResponse, 'camel'>
> => {
  const providedParams = [pan, tokenId, tokenIntentId].filter(param => param !== undefined);
  if (providedParams.length === 0) {
      throw new Error('One of pan, tokenId, or tokenIntentId is required.');
  }
  if (providedParams.length > 1) {
      throw new Error('Only one of pan, tokenId, or tokenIntentId should be provided.');
  }

  const sessionParamKey = pan ? 'pan' : tokenId ? 'tokenId' : 'tokenIntentId';
  const sessionParamValue = pan || tokenId || tokenIntentId;

  const deviceInfo = getDeviceInfo();

  const response = await http.client(
    'POST',
    `/sessions`,
    camelCaseToSnakeCase({
      [sessionParamKey]: sessionParamValue,
      device: 'browser',
      deviceInfo,
    })
  );

  if (!response.ok) {
    let json: unknown;

    try {
      json = await response.json();
    } catch {
      const msg = `Failed to parse error response. HTTP Status: ${response.status}`;
      logger.log.error(msg);
      throw new Error(msg);
    }

    if (isApiError(json)) {
      processApiError(json);
    } else {
      const msg = `An unknown error occurred while creating session. Status: ${response.status}.`;
      logger.log.error(`${msg} Response: ${JSON.stringify(json, null, 2)}`);
      throw new Error(msg);
    }
  }

  const session = snakeCaseToCamelCase<Create3dsSessionResponse>(
    (await response.json()) as Create3dsSessionResponse
  );

  logger.log.info(`3DS session response received with ID ${session.id}`);

  if (session.methodUrl) {
    notify({
      isCompleted: false,
      id: session.id,
      type: NotificationType.START_METHOD_TIME_OUT,
    });

    submitMethodRequest(
      session.methodUrl,
      session.id,
      session.methodNotificationUrl
    );
  }

  return session;
};

export const createSession = async ({
  tokenId,
  tokenIntentId,
  pan,
}: Create3dsSessionRequest) => {
  const session = await makeSessionRequest({
    tokenId,
    tokenIntentId,
    pan,
  }).catch((error) => {
    return Promise.reject((error as Error).message);
  });

  // skip message handling, no method request necessary
  if (!session.methodUrl) {
    return {
      id: session.id,
      cardBrand: session.cardBrand,
    };
  }

  return await handleCreateSession(session);
};
