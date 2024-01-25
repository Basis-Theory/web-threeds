import { CHALLENGE_REQUEST, METHOD_REQUEST } from './constants';
import { createSession } from './session';
import { startChallenge } from './challenge';
import { createIframeContainer } from './utils/dom';
import { logger } from './utils/logging';

type ConfigOptions = {
  apiBaseUrl?: string;
};

const BasisTheory3ds = (async () => {
  // any pre-init tasks go here

  // TODO applyInitialConfig()

  // Create iframe containers before anything else
  try {
    createIframeContainer(METHOD_REQUEST.FRAME_CONTAINER_ID);
    createIframeContainer(CHALLENGE_REQUEST.FRAME_CONTAINER_ID);
  } catch (error) {
    await logger.log.error('Unable to create iframe container', error as Error);
  }

  return (apiKey: string, configOptions?: ConfigOptions) => {
    if (!apiKey) throw new Error('Missing API KEY');
    if (configOptions) {
      // TODO: applyConfigOverrides()
    }

    return {
      createSession: createSession(apiKey),
      startChallenge: startChallenge(apiKey),
    };
  };
})();

export { BasisTheory3ds };
