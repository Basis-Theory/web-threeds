import {
  CHALLENGE_REQUEST,
  METHOD_REQUEST,
  SDK_BASE_URL,
} from '~src/constants';
import { createSession } from '~src/session';
import { startChallenge } from '~src/challenge';
import { createIframeContainer } from '~src/utils/dom';
import { configureLogger, logger } from '~src/utils/logging';
import { http } from '~src/utils/http';

export let sdkBaseUrl = SDK_BASE_URL;

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
   * Allows customization fo sdk base url (for static pages access)
   */
  sdkBaseUrl?: string;
  /**
   * Disables telemetry
   */
  disableTelemetry?: boolean;
};

const BasisTheory3ds = (() => {
  return (apiKey: string, configOptions?: ConfigOptions) => {
    try {
      configureLogger({
        disableTelemetry: configOptions?.disableTelemetry ?? false,
      });
      createIframeContainer(METHOD_REQUEST.FRAME_CONTAINER_ID, true);
      createIframeContainer(CHALLENGE_REQUEST.FRAME_CONTAINER_ID);
    } catch (error) {
      logger.log.error('Unable to create iframe container', error as Error);
    }

    sdkBaseUrl = configOptions?.sdkBaseUrl ?? SDK_BASE_URL;

    http.init(apiKey, configOptions?.apiBaseUrl);

    return { createSession, startChallenge };
  };
})();

window.BasisTheory3ds = BasisTheory3ds;

export { BasisTheory3ds };
