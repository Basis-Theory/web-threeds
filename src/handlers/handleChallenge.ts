import { CHALLENGE_REQUEST } from '~src/constants';
import { removeIframe } from '~src/utils/dom';
import {
  Notification,
  NotificationType,
  isNotification,
} from '~src/utils/events';
import { logger } from '~src/utils/logging';

export const handleChallenge = (
  timeout: number = 60000
): Promise<{
  id: string;
  isCompleted?: boolean;
  authenticationStatus?: string;
}> => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<Notification>) => {
      if (isNotification(event.data)) {
        if (event.data.type === NotificationType.ERROR) {
          logger.log.error(
            `Error occurred during challenge: ${event?.data?.details}`
          );

          reject(
            new Error(
              `An error occurred during challenge: ${event?.data?.details}`
            )
          );

          removeIframe([CHALLENGE_REQUEST.IFRAME_NAME]);
          clearTimeout(timeout);
        } else if (event.data.type === NotificationType.CHALLENGE) {
          clearTimeout(timeoutId);
          window.removeEventListener('message', handleMessage);

          const toResponse = (
            event: MessageEvent<Notification>
          ): {
            id: string;
            isCompleted?: boolean;
            authenticationStatus?: string;
          } => ({
            id: event.data.id,
            isCompleted: event.data.isCompleted,
            authenticationStatus: event.data.authenticationStatus,
          });

          const response = toResponse(event);

          logger.log.info(
            `${event.data.type} notification received for session: ${response.id}`
          );

          resolve(response);
          removeIframe([CHALLENGE_REQUEST.IFRAME_NAME]);
        } else if (!event.isTrusted) {
          // discard untrusted events
        } else {
          // ignore other trusted messages
        }
      }
    };

    window.addEventListener('message', handleMessage);

    timeoutId = setTimeout(() => {
      window.removeEventListener('message', handleMessage);

      reject(
        new Error(
          'Timed out waiting for a challenge response. Please try again.'
        )
      );

      removeIframe([CHALLENGE_REQUEST.IFRAME_NAME]);
    }, timeout);
  });
};
