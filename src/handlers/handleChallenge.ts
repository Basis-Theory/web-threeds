import { CHALLENGE_REQUEST } from '~src/constants';
import { removeIframe } from '~src/utils/dom';
import {
  Notification,
  NotificationType,
  isNotification,
} from '~src/utils/events';
import { logger } from '~src/utils/logging';

export const handleChallenge = (
  timeout: number = 300000,
  sessionId?: string
): Promise<{
  id: string;
  isCompleted?: boolean;
  authenticationStatus?: string;
}> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  let settled = false;

  return new Promise((resolve, reject) => {
    const handleAbandon = () => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      window.removeEventListener('pagehide', handleAbandon);
      logger.log.warn('Challenge abandoned', {
        event: 'challenge.abandoned',
        sessionId: sessionId ?? '',
      });
      removeIframe([CHALLENGE_REQUEST.IFRAME_NAME]);
    };

    const handleMessage = (event: MessageEvent<Notification>) => {
      if (settled || !isNotification(event.data)) {
        return;
      }

      if (sessionId && event.data.id !== sessionId) {
        return;
      }

      if (event.data.type === NotificationType.CHALLENGE) {
        settled = true;
        clearTimeout(timeoutId);
        window.removeEventListener('message', handleMessage);

        logger.log.info('Challenge completed', {
          event: 'challenge.completed',
          sessionId: event.data.id,
          authenticationStatus: event.data.authenticationStatus ?? '',
        });

        resolve({
          id: event.data.id,
          isCompleted: event.data.isCompleted,
          authenticationStatus: event.data.authenticationStatus,
        });

        removeIframe([CHALLENGE_REQUEST.IFRAME_NAME]);
      } else if (event.data.type === NotificationType.ERROR) {
        settled = true;
        clearTimeout(timeoutId);
        window.removeEventListener('message', handleMessage);

        logger.log.error(
          `Error occurred during challenge: ${event?.data?.details}`
        );

        reject(
          new Error(
            `An error occurred during challenge: ${event?.data?.details}`
          )
        );

        removeIframe([CHALLENGE_REQUEST.IFRAME_NAME]);
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('pagehide', handleAbandon);

    timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      window.removeEventListener('message', handleMessage);

      logger.log.warn('Challenge timed out', {
        event: 'challenge.timed_out',
        sessionId: sessionId ?? '',
      });

      reject(
        new Error(
          'Timed out waiting for a challenge response. Please try again.'
        )
      );

      removeIframe([CHALLENGE_REQUEST.IFRAME_NAME]);
    }, timeout);
  });
};
