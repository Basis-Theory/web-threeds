import { sdkBaseUrl } from '.';
import {
  ACS_MODE,
  AcsMode,
  CHALLENGE_PAGE_PATH,
  CHALLENGE_REQUEST,
} from './constants';
import { handleChallenge } from './handlers/handleChallenge';
import { WindowSizeId, getWindowSizeById } from './utils/browser';
import { createForm, createIframe, createInput } from './utils/dom';
import { encode } from './utils/encoding';
import { logger } from './utils/logging';

type ThreeDSChallengeRequest = {
  acsChallengeUrl: string;
  acsTransactionId: string;
  sessionId: string;
  threeDSVersion: '2.1.0' | '2.2.0';
  /**
   * Values represent window size identifiers:
   * - '01' = 250x400px
   * - '02' = 390x400px
   * - '03' = 500x600px
   * - '04' = 600x400px
   * - '05' = 100%x100%
   */
  windowSize?: `${WindowSizeId}` | WindowSizeId;
  timeout?: number;
  /**
   * @deprecated This property is deprecated and will be removed in the next major version
   */
  mode?: AcsMode;
  containerId?: string;
};
interface AcsThreeDSChallengeRequest {
  messageType: 'CReq'; // Must always be set to "CReq"
  messageVersion: string; // Should be set to the same value as in the Authenticate Response
  threeDSServerTransID: string; // Unique identifier (UUID) for tracking the transaction throughout the 3DS process
  acsTransID: string; // Unique identifier (UUID) for tracking the transaction throughout the 3DS process
  challengeWindowSize: WindowSizeId; // Dimensions of the challenge window
}

type ThreeDSSession = {
  id: string;
};

function isAcsThreeDSChallengeRequest(
  obj: unknown
): obj is AcsThreeDSChallengeRequest {
  const {
    messageType,
    messageVersion,
    threeDSServerTransID,
    acsTransID,
    challengeWindowSize,
  } = obj as AcsThreeDSChallengeRequest;

  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof messageType === 'string' &&
    typeof messageVersion === 'string' &&
    typeof threeDSServerTransID === 'string' &&
    typeof acsTransID === 'string' &&
    Object.values(WindowSizeId).includes(challengeWindowSize)
  );
}

const submitChallengeRequest = (
  acsURL: string,
  creq: AcsThreeDSChallengeRequest,
  containerId?: string
) => {
  const container = document.getElementById(
    containerId ?? CHALLENGE_REQUEST.FRAME_CONTAINER_ID
  );

  const windowSize = getWindowSizeById(creq.challengeWindowSize);

  const creqBase64 = encode(creq);
  const challengeIframeName = CHALLENGE_REQUEST.IFRAME_NAME;

  const challengeIframe = createIframe(
    container,
    challengeIframeName,
    challengeIframeName,
    windowSize[0],
    windowSize[1]
  );

  challengeIframe.src = `${sdkBaseUrl}/${CHALLENGE_PAGE_PATH}`;

  challengeIframe.onload = () => {
    challengeIframe.contentWindow?.postMessage(
      {
        type: 'startChallenge',
        acsURL,
        creq: creqBase64,
      },
      '*'
    );
  };
};

/**
 * @deprecated This method is deprecated and will be removed in the next major version
 */
const submitChallengeRequestRedirect = (
  acsURL: string,
  creq: AcsThreeDSChallengeRequest
) => {
  const windowSize = getWindowSizeById(creq.challengeWindowSize);
  const newWindow = window.open(
    '',
    'threeDSChallenge',
    `width=${windowSize[0]},height=${windowSize[1]}`
  );

  if (!newWindow) {
    throw new Error('Popup blocked or unable to open the window.');
  }

  const creqBase64 = encode(creq);

  const form = createForm(
    CHALLENGE_REQUEST.FORM_NAME,
    acsURL,
    'threeDSChallenge'
  );
  const creqInput = createInput('creq', creqBase64);

  form.appendChild(creqInput);

  document.body.appendChild(form);
  form.submit();
};

const makeChallengeRequest = ({
  sessionId,
  acsTransactionId,
  acsChallengeUrl,
  threeDSVersion,
  windowSize,
  mode,
  containerId,
}: ThreeDSChallengeRequest): Promise<ThreeDSSession | Error> => {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  const creq: AcsThreeDSChallengeRequest = {
    messageType: 'CReq',
    messageVersion: threeDSVersion,
    threeDSServerTransID: sessionId,
    acsTransID: acsTransactionId,
    challengeWindowSize: (windowSize as WindowSizeId) ?? WindowSizeId.THREE,
  };

  if (isAcsThreeDSChallengeRequest(creq)) {
    if (mode === ACS_MODE.REDIRECT) {
      submitChallengeRequestRedirect(acsChallengeUrl, creq);
    } else {
      submitChallengeRequest(acsChallengeUrl, creq, containerId);
    }
  } else {
    const err = `Invalid challenge request payload for session: ${sessionId}`;

    logger.log.error(err);

    return Promise.reject(new Error(err));
  }

  return Promise.resolve({ id: sessionId } as ThreeDSSession);
};

export const startChallenge = async ({
  sessionId,
  acsTransactionId,
  acsChallengeUrl,
  threeDSVersion,
  windowSize,
  mode = 'iframe',
  timeout = 60000,
  containerId,
}: ThreeDSChallengeRequest) => {
  await makeChallengeRequest({
    sessionId,
    acsTransactionId,
    acsChallengeUrl,
    threeDSVersion,
    windowSize,
    mode,
    containerId,
  }).catch((error) => {
    return Promise.reject((error as Error).message);
  });

  return handleChallenge(timeout);
};
