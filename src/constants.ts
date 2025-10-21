export const METHOD_REQUEST = {
  FRAME_CONTAINER_ID: 'methodFrameContainer',
  IFRAME_NAME: 'methodIframe',
  FORM_NAME: 'threeDSMethodForm',
  INPUT_NAME: 'threeDSMethodData',
};

export const CHALLENGE_REQUEST = {
  FRAME_CONTAINER_ID: 'challengeFrameContainer',
  IFRAME_NAME: 'challengeIframe',
  FORM_NAME: 'threeDSCReqForm',
};

export const ACS_MODE = {
  IFRAME: 'iframe',
  REDIRECT: 'redirect',
};

export type AcsMode = (typeof ACS_MODE)[keyof typeof ACS_MODE];

export const BT_API_KEY_HEADER_NAME = 'BT-API-KEY';

export const BT_CORRELATION_ID_HEADER_NAME = 'BT-TRACE-ID';

export const API_BASE_URL = 'https://api.basistheory.com';

export const SDK_BASE_URL = 'https://3ds.basistheory.com';

export const METHOD_PAGE_PATH = 'pages/method.html';

export const CHALLENGE_PAGE_PATH = 'pages/challenge.html';
