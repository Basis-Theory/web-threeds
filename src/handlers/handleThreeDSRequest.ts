import {
  Notification,
  NotificationType,
  isNotification,
} from '~src/utils/events';
import { logger } from '~src/utils/logging';

export const handleThreeDSRequest =
  <Payload, Response>(fn: (payload: Payload) => Promise<Response | Error>) =>
  async (payload: Payload): Promise<{ id: string }> =>
    new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<Notification>) => {
        if (
          isNotification(event.data) &&
          event.data.type !== NotificationType.ERROR
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
        } else if (!event.isTrusted) {
          // discard untrusted events
        } else {
          reject('Something happened, please try again.');
        }
      };

      window.addEventListener('message', handleMessage);

      fn(payload).catch((error) => {
        window.removeEventListener('message', handleMessage);

        reject((error as Error).message);
      });
    });
