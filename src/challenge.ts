import { CHALLENGE_REQUEST } from './constants';
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
  session: Record<string, unknown> = {}
) => {
  const container = document.getElementById(
    CHALLENGE_REQUEST.FRAME_CONTAINER_ID
  );

  const windowSize = getWindowSizeById(creq.challengeWindowSize);

  const creqBase64 = encode(creq);
  const sessionDataBase64 = encode(session);
  const challengeIframeName = CHALLENGE_REQUEST.IFRAME_NAME;

  const html = document.createElement('html');
  const body = document.createElement('body');
  const challengeIframe = createIframe(
    container,
    challengeIframeName,
    challengeIframeName,
    windowSize[0],
    windowSize[1]
  );
  const form = createForm(
    CHALLENGE_REQUEST.FORM_NAME,
    acsURL,
    challengeIframe.name
  );
  const creqInput = createInput('creq', creqBase64);
  const sessionDataInput = createInput(
    CHALLENGE_REQUEST.INPUT_NAME,
    sessionDataBase64
  );

  form.appendChild(creqInput);
  form.appendChild(sessionDataInput);
  body.appendChild(form);
  html.appendChild(body);
  challengeIframe.appendChild(html);

  form.submit();
};

const makeChallengeRequest = ({
  sessionId,
  acsTransactionId,
  acsChallengeUrl,
  threeDSVersion,
  windowSize,
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
    submitChallengeRequest(acsChallengeUrl, creq);
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
  timeout = 60000,
}: ThreeDSChallengeRequest) => {
  await makeChallengeRequest({sessionId, acsTransactionId, acsChallengeUrl, threeDSVersion, windowSize}).catch((error) => {
    return Promise.reject((error as Error).message);
  });

  return handleChallenge(timeout);
}
