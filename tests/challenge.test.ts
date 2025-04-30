import { ACS_MODE, CHALLENGE_REQUEST, METHOD_REQUEST } from '~src/constants';
import { startChallenge } from '~src/challenge';
import { createIframeContainer } from '~src/utils/dom';
import { http } from '~src/utils/http';
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

  function resolvePendingPromises() {
    jest.runAllTimersAsync();
    // Wait for promises running in the non-async timer callback to complete.
    // From https://stackoverflow.com/a/58716087/308237
    return new Promise((fn, ...args) => global.setTimeout(fn, 0, ...args));
  }

  it('should return session ID if challenge notification is received', async () => {
    // avoid https://github.com/jsdom/jsdom/issues/1937
    window.HTMLFormElement.prototype.submit = jest.fn();

    createIframeContainer(CHALLENGE_REQUEST.FRAME_CONTAINER_ID);

    const sessionId = '444';

    const startChallengeResponse = {
      id: sessionId,
      isCompleted: true,
      authenticationStatus: 'successful',
    };

    const response = startChallenge({
      sessionId: sessionId,
      acsTransactionId: '1234',
      acsChallengeUrl: 'http://localhost:5000/acs/test',
      threeDSVersion: '2.1.0',
      windowSize: '03',
    });

    await resolvePendingPromises();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { isCompleted: true, id: sessionId, type: 'challenge', authenticationStatus: 'successful' },
      })
    );

    const res = await response;

    expect(res).toStrictEqual(startChallengeResponse);
  });

  it('should reject after challenge timeout', async () => {
    // avoid https://github.com/jsdom/jsdom/issues/1937
    window.HTMLFormElement.prototype.submit = jest.fn();

    createIframeContainer(CHALLENGE_REQUEST.FRAME_CONTAINER_ID);

    const sessionId = '444';

    const response = startChallenge({
      sessionId: sessionId,
      acsTransactionId: '1234',
      acsChallengeUrl: 'http://localhost:5000/acs/test',
      threeDSVersion: '2.1.0',
      windowSize: '03',
      timeout: 10000,
    });

    await resolvePendingPromises();

    // advance timers to trigger timeout
    jest.advanceTimersByTime(10000);

    await expect(response).rejects.toThrow(
      new Error('Timed out waiting for a challenge response. Please try again.')
    );
  }, 10001);

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

  it('should open a new window and send notification when challenge mode === redirect', async () => {
    window.HTMLFormElement.prototype.submit = jest.fn();
    // mock open window reference
    const mockPopup: Partial<Window> = { closed: false };
    const mockWindowOpen = jest
      .spyOn(window, 'open')
      .mockImplementation(() => mockPopup as Window);

    const sessionId = '444';

    const startChallengeResponse = {
      id: sessionId,
      isCompleted: true,
      authenticationStatus: 'successful',
    };

    queueMock(startChallengeResponse);

    const challengePromise = startChallenge({
      sessionId: sessionId,
      acsTransactionId: '1234',
      acsChallengeUrl: 'http://localhost:5000/acs/test',
      threeDSVersion: '2.1.0',
      windowSize: '03',
      mode: ACS_MODE.REDIRECT,
    });

    expect(mockWindowOpen).toHaveBeenCalledWith('', 'threeDSChallenge', 'width=500px,height=600px');

    await resolvePendingPromises();

    // simulate the popup window sending a notification
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          isCompleted: true,
          id: sessionId,
          type: 'challenge',
          authenticationStatus: 'successful'
        }
      })
    );

    const res = await challengePromise;
    expect(res).toStrictEqual(startChallengeResponse);

    mockWindowOpen.mockRestore();
  });
});
