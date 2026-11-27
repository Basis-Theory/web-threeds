import {
  ACS_MODE,
  AcsMode,
  BT_CORRELATION_ID_HEADER_NAME,
} from '~src/constants';
import { detectWebView, getDeviceInfo } from '~src/utils/browser';
import {
  DeepTransformKeysCase,
  camelCaseToSnakeCase,
  snakeCaseToCamelCase,
} from '~src/utils/casing';
import { http } from '~src/utils/http';
import { logger } from '~src/utils/logging';
import { startMethod } from './method';
import { isApiError, processApiError } from './utils/errors';
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

const makeSessionRequest = async ({
  tokenId,
  tokenIntentId,
  pan,
  challengeMode,
  correlationId,
  metadata,
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
      await logger.log.error(
        `${msg} Response: ${JSON.stringify(json, null, 2)}`
      );
      throw new Error(msg);
    }
  }

  const session = snakeCaseToCamelCase<Create3dsSessionResponse>(
    (await response.json()) as Create3dsSessionResponse
  );

  session.correlationId =
    response.headers?.get(BT_CORRELATION_ID_HEADER_NAME) || '';

  await logger.log.info(`3DS session response received with ID ${session.id}`);

  await logger.log.info('3ds-device-fingerprint', {
    sessionId: session.id,
    ...Object.fromEntries(
      Object.entries(deviceInfo).map(([k, v]) => [k, String(v)])
    ),
    isWebView: String(detectWebView()),
  });

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
    };

    if (session.additionalCardBrands) {
      response.additionalCardBrands = session.additionalCardBrands;
    }

    if (session.metadata) {
      response.metadata = session.metadata;
    }

    return response;
  }

  await startMethod({
    sessionId: session.id,
    methodUrl: session.methodUrl,
    methodNotificationUrl: session.methodNotificationUrl ?? '',
    methodRequestMode,
  });

  const response: {
    id: string;
    cardBrand?: string;
    correlationId: string;
    additionalCardBrands?: string[];
  } = {
    id: session.id,
    cardBrand: session.cardBrand,
    correlationId: session.correlationId,
  };

  if (session.additionalCardBrands) {
    response.additionalCardBrands = session.additionalCardBrands;
  }

  return response;
};
