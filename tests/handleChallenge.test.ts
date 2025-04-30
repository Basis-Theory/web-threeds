import { removeIframe } from '~src/utils/dom';
import { logger } from '~src/utils/logging';
import { Notification, NotificationType } from '~src/utils/events';
import { CHALLENGE_REQUEST, METHOD_REQUEST } from '~src/constants';
import { handleChallenge } from '~src/handlers/handleChallenge';

jest.mock('~src/utils/dom', () => ({
  removeIframe: jest.fn(),
}));

jest.mock('~src/utils/logging', () => ({
  logger: {
    log: {
      info: jest.fn(),
    },
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});

test.each([
  [
    `should resolve with response when receiving valid ${NotificationType.CHALLENGE} notification`,
    NotificationType.CHALLENGE,
    CHALLENGE_REQUEST.IFRAME_NAME,
    { id: '1234', isCompleted: true, authenticationStatus: 'successful' },
  ],
])(
  '%s',
  async (
    description,
    notificationType,
    iframeContainerId,
    expectedResponse
  ) => {
    const promise = handleChallenge();

    const notification: Notification = {
      isCompleted: true,
      type: notificationType,
      id: '1234',
      authenticationStatus: 'successful',
    };

    // Dispatch the message
    window.postMessage(notification, '*');

    // Wait for the promise to resolve
    const result = await promise;

    expect(result).toEqual(expectedResponse);
    expect(removeIframe).toHaveBeenCalledWith([iframeContainerId]);
    expect(logger.log.info).toHaveBeenCalledWith(
      `${notificationType} notification received for session: ${expectedResponse.id}`
    );
  }
);
