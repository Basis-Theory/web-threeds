import { CHALLENGE_REQUEST, METHOD_REQUEST } from '~src/constants';
import { Create3dsSessionResponse } from '~src/session';
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

export const handleCreateSession = (
  session: Create3dsSessionResponse
): Promise<{ id: string; cardBrand?: string }> => {
  let timeout: ReturnType<typeof setTimeout>;

  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<Notification>) => {
      if (isNotification(event.data)) {
        if (event.data.type === NotificationType.ERROR) {
          logger.log.error(`Error occurred during session creation: ${event?.data?.details}`);

          reject(`An error occurred during session creation: ${event?.data?.details}`);
          removeIframe(getIframeId(event.data?.type));
          clearTimeout(timeout);
        } else if (event.data.type === NotificationType.START_METHOD_TIME_OUT) {
          timeout = setTimeout(() => {
            notify({
              id: event.data.id,
              type: NotificationType.METHOD_TIME_OUT,
              isCompleted: false,
            });
          }, 10000);
        } else if (event.data.type === NotificationType.CHALLENGE) {
          // discard challenge events
        } else if (!event.isTrusted) {
          // discard untrusted events
        } else {
          // handle session creation event
          window.removeEventListener('message', handleMessage);

          const toResponse = (
            event: MessageEvent<Notification>
          ): { id: string; cardBrand?: string } => ({
            id: event.data.id,
            cardBrand: session.cardBrand,
          });

          const response = toResponse(event);

          resolve(response);
          removeIframe(getIframeId(event.data?.type));
          clearTimeout(timeout);
        }
      } else {
        // discard other events
      }
    };

    window.addEventListener('message', handleMessage);
  });
};
