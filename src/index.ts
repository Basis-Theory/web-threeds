import { CHALLENGE_REQUEST, METHOD_REQUEST } from '~src/constants';
import { createSession } from '~src/session';
import { startChallenge } from '~src/challenge';
import { createIframeContainer } from '~src/utils/dom';
import { logger } from '~src/utils/logging';
import { http } from '~src/utils/http';

type ConfigOptions = {
  /**
   * Allows customization of api base url
   */
  apiBaseUrl?: string;
};

const BasisTheory3ds = (() => {
  try {
    createIframeContainer(METHOD_REQUEST.FRAME_CONTAINER_ID);
    createIframeContainer(CHALLENGE_REQUEST.FRAME_CONTAINER_ID);
  } catch (error) {
    logger.log.error('Unable to create iframe container', error as Error);
  }

  return (apiKey: string, configOptions?: ConfigOptions) => {
    http.init(apiKey, configOptions?.apiBaseUrl);

    return { createSession, startChallenge };
  };
})();

export { BasisTheory3ds };
