import { removeIframe } from '~src/utils/dom';
import { logger } from '~src/utils/logging';
import { Notification, NotificationType } from '~src/utils/events';
import { handleThreeDSRequest } from '~src/handlers/handleThreeDSRequest';
import { CHALLENGE_REQUEST, METHOD_REQUEST } from '~src/constants';

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
    `should resolve with response when receiving valid ${NotificationType.METHOD} notification`,
    NotificationType.METHOD,
    METHOD_REQUEST.IFRAME_NAME,
    { id: '1234' },
  ],
  [
    `should resolve with response when receiving valid ${NotificationType.CHALLENGE} notification`,
    NotificationType.CHALLENGE,
    CHALLENGE_REQUEST.IFRAME_NAME,
    { id: '1234' },
  ],
  [
    `should resolve with response when receiving valid ${NotificationType.METHOD_TIME_OUT} notification`,
    NotificationType.METHOD_TIME_OUT,
    METHOD_REQUEST.IFRAME_NAME,
    { id: '1234' },
  ],
  ,
])(
  '%s',
  async (
    description,
    notificationType,
    iframeContainerId,
    expectedResponse
  ) => {
    const mockedHandler = jest.fn().mockResolvedValue({ id: '123' });

    const promise = handleThreeDSRequest(mockedHandler)({});

    const notification: Notification = {
      isCompleted: true,
      type: notificationType,
      id: '1234',
    };

    window.postMessage(notification, '*');

    await expect(promise).resolves.toEqual(expectedResponse);
    expect(removeIframe).toHaveBeenCalledWith([iframeContainerId]);
    expect(logger.log.info).toHaveBeenCalledWith(
      `${notificationType} notification received for session: ${expectedResponse.id}`
    );
  }
);
