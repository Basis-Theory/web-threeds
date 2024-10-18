import { CHALLENGE_REQUEST } from '~src/constants';
import { removeIframe } from '~src/utils/dom';
import {
  Notification,
  NotificationType,
  isNotification,
} from '~src/utils/events';
import { logger } from '~src/utils/logging';

export const handleChallenge = (timeout: number = 60000): Promise<{ id: string }> => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<Notification>) => {
      if (
        isNotification(event.data) &&
        event.data.type === NotificationType.CHALLENGE
      ) {
        clearTimeout(timeoutId);
        window.removeEventListener('message', handleMessage);

        const toResponse = (
          event: MessageEvent<Notification>
        ): { id: string } => ({
          id: event.data.id,
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
    };

    window.addEventListener('message', handleMessage);

    timeoutId = setTimeout(() => {
      window.removeEventListener('message', handleMessage);

      reject('Timed out waiting for a challenge response. Please try again.');

      removeIframe([CHALLENGE_REQUEST.IFRAME_NAME]);
    }, timeout);
  });
};
