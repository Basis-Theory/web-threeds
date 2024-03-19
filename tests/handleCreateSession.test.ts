import { removeIframe } from '~src/utils/dom';
import { logger } from '~src/utils/logging';
import { Notification, NotificationType } from '~src/utils/events';
import { METHOD_REQUEST } from '~src/constants';
import { handleCreateSession } from '~src/handlers/handleCreateSession';

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
    { id: '1234', cardBrand: 'visa' },
  ],
  [
    `should resolve with response when receiving valid ${NotificationType.METHOD_TIME_OUT} notification`,
    NotificationType.METHOD_TIME_OUT,
    METHOD_REQUEST.IFRAME_NAME,
    { id: '1234', cardBrand: 'visa' },
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
    const mockSession = ({ id: '123', cardBrand: 'visa' });

    const promise = handleCreateSession(mockSession);

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
