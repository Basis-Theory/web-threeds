import {
  ACS_MODE,
  AcsMode,
  METHOD_PAGE_PATH,
  METHOD_REQUEST,
} from './constants';
import {
  createForm,
  createIframe,
  createIframeContainer,
  createInput,
} from './utils/dom';
import { encode } from './utils/encoding';
import { isNotification, NotificationType } from './utils/events';
import { sdkBaseUrl } from '.';

export interface ThreeDSMethodRequest {
  sessionId: string;
  methodUrl: string;
  methodNotificationUrl: string;
  /**
   * @deprecated Use the default iframe mode.
   */
  methodRequestMode?: AcsMode;
}

export interface ThreeDSMethodResponse {
  isCompleted: boolean;
}

export const startMethod = async ({
  sessionId,
  methodUrl,
  methodNotificationUrl,
  methodRequestMode = ACS_MODE.IFRAME,
}: ThreeDSMethodRequest): Promise<ThreeDSMethodResponse> => {
  if (!sessionId || !methodUrl || !methodNotificationUrl) {
    throw new Error(
      'sessionId, methodUrl, and methodNotificationUrl are required.'
    );
  }

  const methodPageUrl = new URL(
    `${sdkBaseUrl}/${METHOD_PAGE_PATH}`,
    window.location.href
  );
  const notificationUrl = new URL(methodNotificationUrl, window.location.href);
  const useRedirect = methodRequestMode === ACS_MODE.REDIRECT;

  if (useRedirect) {
    notificationUrl.searchParams.set('mode', ACS_MODE.REDIRECT);
  }

  const methodData = encode({
    threeDSServerTransID: sessionId,
    threeDSMethodNotificationURL: notificationUrl.href,
  });

  return new Promise((resolve, reject) => {
    let iframe: HTMLIFrameElement | undefined;
    let popup: Window | null = null;
    let form: HTMLFormElement | undefined;
    let closeInterval: ReturnType<typeof setInterval> | undefined;
    let settled = false;

    const cleanup = () => {
      settled = true;
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
      clearInterval(closeInterval);
      iframe?.remove();
      form?.remove();
    };

    const complete = (isCompleted: boolean) => {
      if (!settled) {
        cleanup();
        resolve({ isCompleted });
      }
    };

    const handleMessage = (event: MessageEvent<unknown>) => {
      if (
        !isNotification(event.data) ||
        event.data.id !== sessionId ||
        event.data.type !== NotificationType.METHOD
      ) {
        return;
      }

      const expectedSource = useRedirect ? popup : iframe?.contentWindow;
      const expectedOrigin = useRedirect
        ? notificationUrl.origin
        : methodPageUrl.origin;

      if (
        !expectedSource ||
        event.source !== expectedSource ||
        event.origin !== expectedOrigin
      ) {
        return;
      }

      complete(event.data.isCompleted);
    };

    window.addEventListener('message', handleMessage);
    const timeout = setTimeout(() => complete(false), 10000);

    try {
      if (useRedirect) {
        popup = window.open('', METHOD_REQUEST.FORM_NAME);
        if (!popup) {
          complete(false);
          return;
        }

        form = createForm(
          METHOD_REQUEST.FORM_NAME,
          methodUrl,
          METHOD_REQUEST.FORM_NAME
        );
        form.appendChild(createInput(METHOD_REQUEST.INPUT_NAME, methodData));
        document.body.appendChild(form);
        closeInterval = setInterval(() => {
          if (popup?.closed) complete(false);
        }, 500);
        form.submit();
      } else {
        if (!document.getElementById(METHOD_REQUEST.FRAME_CONTAINER_ID)) {
          createIframeContainer(METHOD_REQUEST.FRAME_CONTAINER_ID, true);
        }

        iframe = createIframe(
          document.getElementById(METHOD_REQUEST.FRAME_CONTAINER_ID),
          METHOD_REQUEST.IFRAME_NAME,
          METHOD_REQUEST.IFRAME_NAME,
          '0',
          '0'
        );
        iframe.onload = () => {
          if (!settled) {
            iframe?.contentWindow?.postMessage(
              {
                type: 'startMethod',
                threeDSMethodURL: methodUrl,
                threeDSMethodData: methodData,
              },
              methodPageUrl.origin
            );
          }
        };
        iframe.src = methodPageUrl.href;
      }
    } catch (error) {
      cleanup();
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
};
