import { METHOD_REQUEST } from '~src/constants';
import { createSession } from '~src/session';
import { createIframeContainer } from '~src/utils/dom';
import { http } from '~src/utils/http';

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

describe('createSession', () => {
  beforeAll(() => {
    jest.useFakeTimers();

    jest.spyOn(window, 'setTimeout');

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
    jest.clearAllMocks();
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

  it('should create a session and send method request if version methodUrl is available', async () => {
    // avoid https://github.com/jsdom/jsdom/issues/1937
    window.HTMLFormElement.prototype.submit = jest.fn();

    createIframeContainer(METHOD_REQUEST.FRAME_CONTAINER_ID);

    const pan = 'mockPan';

    const versionResponse = {
      id: 'mockSessionId',
      cardBrand: 'visa',
      methodUrl: 'mockMethodUrl',
    };

    const createSessionResponse = {
      id: 'mockSessionId',
      cardBrand: 'visa',
    };

    queueMock(versionResponse);
    queueMock(createSessionResponse);

    const response = createSession({ pan });

    await resolvePendingPromises();

    // mock event from method notification
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { isCompleted: true, id: 'mockSessionId', type: 'method' },
      })
    );

    const res = await response;

    expect(res).toStrictEqual(createSessionResponse);
  });

  it("should return session id at 10s if there's no method response", async () => {
    // avoid https://github.com/jsdom/jsdom/issues/1937
    window.HTMLFormElement.prototype.submit = jest.fn();

    createIframeContainer(METHOD_REQUEST.FRAME_CONTAINER_ID);

    const pan = 'mockPan';

    const versionResponse = {
      id: 'mockSessionId',
      cardBrand: 'visa',
      methodUrl: 'mockMethodUrl',
      notificationUrl: 'http://test.com',
    };

    const createSessionResponse = {
      id: 'mockSessionId',
      cardBrand: 'visa',
    };

    queueMock(versionResponse);
    queueMock(createSessionResponse);

    const res = createSession({ pan });

    await resolvePendingPromises();

    const response = await res;

    expect(response).toStrictEqual(createSessionResponse);
    expect(setTimeout).toHaveBeenCalled();
  }, 10001);

  it('should handle the case where version methodUrl is not available', async () => {
    const versionResponse = {
      id: 'mockSessionId',
      methodUrl: undefined,
    };

    const pan = 'mockPan';

    queueMock(versionResponse);
    queueMock(undefined);

    const response = createSession({ pan });

    // mock event from method notification
    window.dispatchEvent(
      new MessageEvent('message', {
        data: undefined,
      })
    );

    expect(response).rejects.toEqual('Something happened, please try again.');
    expect(setTimeout).not.toHaveBeenCalled();
  });
});
