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
  sessionId?: string,
  tenantId?: string,
  tenantType?: string
): Promise<{
  id: string;
  isCompleted?: boolean;
  authenticationStatus?: string;
}> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  let settled = false;
  const controller = new AbortController();

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      settled = true;
      clearTimeout(timeoutId);
      controller.abort();
      removeIframe([CHALLENGE_REQUEST.IFRAME_NAME]);
    };

    const handleAbandon = () => {
      if (settled) {
        return;
      }
      logger.log.warn('Challenge abandoned', {
        event: 'challenge.abandoned',
        sessionId: sessionId ?? '',
        tenantId: tenantId ?? '',
        tenantType: tenantType ?? '',
      });
      cleanup();
    };

    const handleMessage = (event: MessageEvent<Notification>) => {
      if (settled || !isNotification(event.data)) {
        return;
      }

      if (sessionId && event.data.id !== sessionId) {
        return;
      }

      if (event.data.type === NotificationType.CHALLENGE) {
        logger.log.info('Challenge completed', {
          event: 'challenge.completed',
          sessionId: event.data.id,
          authenticationStatus: event.data.authenticationStatus ?? '',
          tenantId: tenantId ?? '',
          tenantType: tenantType ?? '',
        });

        resolve({
          id: event.data.id,
          isCompleted: event.data.isCompleted,
          authenticationStatus: event.data.authenticationStatus,
        });

        cleanup();
      } else if (event.data.type === NotificationType.ERROR) {
        logger.log.error(
          `Error occurred during challenge: ${event?.data?.details}`
        );

        reject(
          new Error(
            `An error occurred during challenge: ${event?.data?.details}`
          )
        );

        cleanup();
      }
    };

    window.addEventListener('message', handleMessage, {
      signal: controller.signal,
    });
    window.addEventListener('pagehide', handleAbandon, {
      signal: controller.signal,
    });

    timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      logger.log.warn('Challenge timed out', {
        event: 'challenge.timed_out',
        sessionId: sessionId ?? '',
        tenantId: tenantId ?? '',
        tenantType: tenantType ?? '',
      });

      reject(
        new Error(
          'Timed out waiting for a challenge response. Please try again.'
        )
      );

      cleanup();
    }, timeout);
  });
};
