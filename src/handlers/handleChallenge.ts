import { CHALLENGE_REQUEST } from '~src/constants';
import { removeIframe } from '~src/utils/dom';
import {
  Notification,
  NotificationType,
  isNotification,
} from '~src/utils/events';
import { logger } from '~src/utils/logging';

export const handleChallenge = (): Promise<{ id: string }> => {
  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<Notification>) => {
      if (
        isNotification(event.data) &&
        event.data.type === NotificationType.CHALLENGE
      ) {
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
        reject('Something happened during a challenge, please try again.');
        removeIframe([CHALLENGE_REQUEST.IFRAME_NAME]);
      }
    };

    window.addEventListener('message', handleMessage);
  });
};
