export const startChallenge = (apiKey: string) => async () => {
  console.log('TODO: DO THE THING');
  /*
interface ThreeDSChallengeRequest {
  messageType: string; // Must always be set to "CReq"
  messageVersion: string; // Should be set to the same value as in the Authenticate Response
  threeDSServerTransID: string; // Unique identifier (UUID) for tracking the transaction throughout the 3DS process
  acsTransID: string; // Unique identifier (UUID) for tracking the transaction throughout the 3DS process
  challengeWindowSize: WindowSizeId; // Dimensions of the challenge window
}

interface ThreeDSChallengeResponse {
  messageType: string; // Will always be "CRes"
  messageVersion: string; // 3DS protocol version identifier
  threeDSServerTransID: string; // Unique identifier (UUID) for tracking the transaction throughout the 3DS process
  acsTransID: string; // Unique identifier (UUID) used by the ACS for tracking the transaction throughout the 3DS process
  transStatus: 'Y' | 'N'; // Outcome of the challenge request
}

const sendChallengeRequest = (
  acsURL: string,
  creq: ThreeDSChallengeRequest,
  sessionData: Record<string, unknown>
) => {
  const frameContainer = document.getElementById(
    CHALLENGE_REQUEST.FRAME_CONTAINER_ID
  );

  const windowSize = getWindowSize(creq.challengeWindowSize);

  const creqBase64 = encode(creq);
  const sessionDataBase64 = encode(sessionData);
  const challengeIframeName = CHALLENGE_REQUEST.IFRAME_NAME;

  const html = document.createElement('html');
  const body = document.createElement('body');
  const challengeIframe = createIframe(
    frameContainer,
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
 */
};
