import { CHALLENGE_REQUEST, METHOD_REQUEST } from '~src/constants';
import { createSession } from '~src/session';
import { startChallenge } from '~src/challenge';
import { createIframeContainer } from '~src/utils/dom';
import { configureLogger, logger } from '~src/utils/logging';
import { http } from '~src/utils/http';

declare global {
  interface Window {
    BasisTheory3ds?: typeof BasisTheory3ds;
  }
}

type ConfigOptions = {
  /**
   * Allows customization of api base url
   */
  apiBaseUrl?: string;
  /**
   * Disables telemetry
   */
  disableTelemetry?: boolean;
  challengeContainerOptions?: {
    /**
     * Overrides default ID of iframe container
     */
    id?: string;
  };
};

const BasisTheory3ds = (() => {
  return (apiKey: string, configOptions?: ConfigOptions) => {
    try {
      configureLogger({
        disableTelemetry: configOptions?.disableTelemetry ?? false
      });
      createIframeContainer(METHOD_REQUEST.FRAME_CONTAINER_ID, true);
      createIframeContainer(
        configOptions?.challengeContainerOptions?.id ??
          CHALLENGE_REQUEST.FRAME_CONTAINER_ID
      );
    } catch (error) {
      logger.log.error('Unable to create iframe container', error as Error);
    }

    http.init(apiKey, configOptions?.apiBaseUrl);

    return { createSession, startChallenge };
  };
})();

window.BasisTheory3ds = BasisTheory3ds;

export { BasisTheory3ds };
