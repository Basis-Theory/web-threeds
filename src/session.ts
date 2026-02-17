import {
  ACS_MODE,
  AcsMode,
  METHOD_PAGE_PATH,
  METHOD_REQUEST,
  BT_CORRELATION_ID_HEADER_NAME,
} from '~src/constants';
import { getDeviceInfo } from '~src/utils/browser';
import { createForm, createIframe, createInput } from '~src/utils/dom';
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
import { sdkBaseUrl } from '.';
export interface Create3dsSessionRequest {
  tokenId?: string;
  tokenIntentId?: string;
  correlationId?: string;
  /**
   * @deprecated This property is deprecated in favor of `tokenId`
   */
  pan?: string;
  skipMethodRequest?: boolean;
  /**
   * @deprecated This property is deprecated and will be removed in the next major version.
   */
  methodRequestMode?: AcsMode;
  challengeMode?: AcsMode;
  metadata?: Record<string, unknown>;
}

export type Create3dsSessionResponse = {
  id: string;
  cardBrand?: string;
  method_url?: string;
  method_notification_url?: string;
  additional_card_brands?: string[];
  correlationId: string;
  metadata?: Record<string, unknown>;
};

/**
 * @deprecated This function is deprecated and will be removed in the next major version.
 */
const submitMethodRequestRedirect = (
  threeDSMethodURL: string,
  threeDSServerTransID: string,
  methodNotificationURL?: string
): void => {
  const threeDSMethodDataBase64 = encode({
    threeDSServerTransID,
    threeDSMethodNotificationURL: `${methodNotificationURL}?mode=redirect`,
  });

  const newWindow = window.open('', 'threeDSMethodForm');
  if (!newWindow) {
    console.error('Popup blocked or unable to open the window.');
    return;
  }

  const form = createForm(
    METHOD_REQUEST.FORM_NAME,
    threeDSMethodURL,
    'threeDSMethodForm'
  );
  form.appendChild(
    createInput(METHOD_REQUEST.INPUT_NAME, threeDSMethodDataBase64)
  );

  document.body.appendChild(form);
  form.submit();

  // check periodically if the method window is closed (it closes immediately on completion)
  const checkClosedInterval = window.setInterval(() => {
    if (newWindow.closed) {
      clearInterval(checkClosedInterval);
      notify({
        isCompleted: true,
        id: threeDSServerTransID,
        type: NotificationType.METHOD,
      });
    }
  }, 500);
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

  iframe.src = `${sdkBaseUrl}/${METHOD_PAGE_PATH}`;

  iframe.onload = () => {
    iframe.contentWindow?.postMessage(
      {
        type: 'startMethod',
        threeDSMethodURL,
        threeDSMethodData: threeDSMethodDataBase64,
      },
      '*'
    );
  };
};

const makeSessionRequest = async ({
  tokenId,
  tokenIntentId,
  pan,
  skipMethodRequest = false,
  methodRequestMode,
  challengeMode,
  correlationId,
  metadata
}: Create3dsSessionRequest): Promise<
  DeepTransformKeysCase<Create3dsSessionResponse, 'camel'>
> => {
  const providedParams = [pan, tokenId, tokenIntentId].filter(
    (param) => param !== undefined
  );
  if (providedParams.length === 0) {
    throw new Error('One of pan, tokenId, or tokenIntentId is required.');
  }
  if (providedParams.length > 1) {
    throw new Error(
      'Only one of pan, tokenId, or tokenIntentId should be provided.'
    );
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
      webChallengeMode: challengeMode,
      metadata,
    }),
    correlationId
  );

  if (!response.ok) {
    let json: unknown;

    try {
      json = await response.json();
    } catch {
      const msg = `Failed to parse error response. HTTP Status: ${response.status}`;
      await logger.log.error(msg);
      throw new Error(msg);
    }

    if (isApiError(json)) {
      processApiError(json);
    } else {
      const msg = `An unknown error occurred while creating session. Status: ${response.status}.`;
      await logger.log.error(`${msg} Response: ${JSON.stringify(json, null, 2)}`);
      throw new Error(msg);
    }
  }

  const session = snakeCaseToCamelCase<Create3dsSessionResponse>(
    (await response.json()) as Create3dsSessionResponse
  );

  session.correlationId =
    response.headers?.get(BT_CORRELATION_ID_HEADER_NAME) || '';

  await logger.log.info(`3DS session response received with ID ${session.id}`);

  if (session.methodUrl && !skipMethodRequest) {
    notify({
      isCompleted: false,
      id: session.id,
      type: NotificationType.START_METHOD_TIME_OUT,
    });

    if (methodRequestMode === ACS_MODE.REDIRECT) {
      submitMethodRequestRedirect(
        session.methodUrl,
        session.id,
        session.methodNotificationUrl
      );
    } else {
      submitMethodRequest(
        session.methodUrl,
        session.id,
        session.methodNotificationUrl
      );
    }
  }

  return session;
};

export const createSession = async ({
  tokenId,
  tokenIntentId,
  pan,
  skipMethodRequest = false,
  methodRequestMode = ACS_MODE.IFRAME,
  challengeMode = ACS_MODE.IFRAME,
  correlationId = '',
  metadata = {},
}: Create3dsSessionRequest) => {
  const session = await makeSessionRequest({
    tokenId,
    tokenIntentId,
    pan,
    skipMethodRequest,
    methodRequestMode,
    challengeMode,
    correlationId,
    metadata,
  }).catch((error) => {
    // Preserve the full error object (BasisTheory3dsError or other Error types)
    return Promise.reject(error);
  });

  // skip message handling, no method request necessary
  if (!session.methodUrl || skipMethodRequest) {
    const response: {
      id: string;
      cardBrand?: string;
      additionalCardBrands?: string[];
      metadata?: Record<string, unknown>;
    } = {
      id: session.id,
      cardBrand: session.cardBrand,
      metadata: session.metadata,
    };

    if (session.additionalCardBrands) {
      response.additionalCardBrands = session.additionalCardBrands;
    }

    if (session.metadata) {
      response.metadata = session.metadata;
    }

    return response;
  }

  return await handleCreateSession(session);
};
