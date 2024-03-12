import { CHALLENGE_REQUEST, METHOD_REQUEST } from '~src/constants';
import { removeIframe } from '~src/utils/dom';
import {
  Notification,
  NotificationType,
  isNotification,
  notify,
} from '~src/utils/events';
import { logger } from '~src/utils/logging';

const getIframeId = (type: NotificationType): string[] =>
  ({
    [NotificationType.CHALLENGE]: CHALLENGE_REQUEST.IFRAME_NAME,
    [NotificationType.METHOD]: METHOD_REQUEST.IFRAME_NAME,
    [NotificationType.METHOD_TIME_OUT]: METHOD_REQUEST.IFRAME_NAME,
    [NotificationType.ERROR]: `${METHOD_REQUEST.IFRAME_NAME},${CHALLENGE_REQUEST.IFRAME_NAME}`,
    [NotificationType.START_METHOD_TIME_OUT]: '',
  })[type]?.split(',');

export const handleThreeDSRequest = <Payload, Response>(
  fn: (payload: Payload) => Promise<Response | Error>
) => {
  let timeout: ReturnType<typeof setTimeout>;

  return async (payload: Payload): Promise<{ id: string }> => {
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<Notification>) => {
        if (
          isNotification(event.data) &&
          event.data?.type === NotificationType.START_METHOD_TIME_OUT
        ) {
          timeout = setTimeout(() => {
            notify({
              id: event.data.id,
              type: NotificationType.METHOD_TIME_OUT,
              isCompleted: false,
            });
          }, 10000);
        } else if (
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
          removeIframe(getIframeId(event.data?.type));
          clearTimeout(timeout);
        } else if (!event.isTrusted) {
          // discard untrusted events
        } else {
          reject('Something happened, please try again.');
          removeIframe(getIframeId(event.data?.type));
          clearTimeout(timeout);
        }
      };

      window.addEventListener('message', handleMessage);

      fn(payload).catch((error) => {
        window.removeEventListener('message', handleMessage);
        reject((error as Error).message);
      });
    });
  };
};
