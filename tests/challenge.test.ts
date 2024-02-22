import { CHALLENGE_REQUEST, METHOD_REQUEST } from '~src/constants';
import { startChallenge } from '~src/challenge';
import { createIframeContainer } from '~src/utils/dom';
import { http } from '~src/utils/http';
import { NotificationType } from '~src/utils/events';
import { WindowSizeId } from '~src/utils/browser';

let fetchMocksQueue: Record<string, unknown>[] = [];

const queueMock = (responseData?: Record<string, unknown>) => {
  fetchMocksQueue.push({
    ok: true,
    json: () => Promise.resolve(responseData),
  });
};

const resetMockQueue = () => {
  fetchMocksQueue = [];
};

jest.mock('~src/utils/logging', () => ({
  logger: {
    log: {
      error: jest.fn(),
      info: jest.fn(),
    },
  },
}));

describe('startChallenge', () => {
  beforeAll(() => {
    jest.useFakeTimers();

    // Initialize http client
    http.init('test');

    // @ts-expect-error
    global.fetch = jest.fn(() => {
      if (fetchMocksQueue.length === 0) {
        throw new Error('No more fetch mocks in the queue.');
      }
      return Promise.resolve(fetchMocksQueue.shift());
    });
  });

  afterEach(() => {
    resetMockQueue();
  });

  afterAll(() => {
    global.fetch = undefined;
    fetchMocksQueue = [];
    jest.useRealTimers();
  });

  it('should return session ID if challenge notification is received', async () => {
    // avoid https://github.com/jsdom/jsdom/issues/1937
    window.HTMLFormElement.prototype.submit = jest.fn();

    createIframeContainer(CHALLENGE_REQUEST.FRAME_CONTAINER_ID);

    const sessionId = '444';

    const startChallengeResponse = {
      id: sessionId,
    };

    const response = startChallenge({
      sessionId: sessionId,
      acsTransactionId: '1234',
      acsChallengeUrl: 'http://localhost:5000/acs/test',
      threeDSVersion: '2.1.0',
      windowSize: '03',
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { isCompleted: true, id: sessionId, type: 'challenge' },
      })
    );

    const res = await response;

    expect(res).toStrictEqual(startChallengeResponse);
  });

  it('should throw when CReq has invalid values', async () => {
    const sessionId = '222';

    const response = startChallenge({
      sessionId: sessionId,
      acsTransactionId: '1234',
      acsChallengeUrl: 'http://localhost:5000/acs/test',
      threeDSVersion: '2.1.0',
      windowSize: '10' as WindowSizeId,
    });

    expect(response).rejects.toEqual(
      `Invalid challenge request payload for session: ${222}`
    );
  });
});
