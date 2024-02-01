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

  afterAll(() => {
    global.fetch = undefined;
    fetchMocksQueue = [];
    jest.useRealTimers();
  });

  it('should create a session and send method request if version methodUrl is available', async () => {
    // avoid https://github.com/jsdom/jsdom/issues/1937
    window.HTMLFormElement.prototype.submit = jest.fn();

    createIframeContainer(METHOD_REQUEST.FRAME_CONTAINER_ID);

    const pan = 'mockPan';

    const versionResponse = {
      id: 'mockSessionId',
      methodUrl: 'mockMethodUrl',
    };

    const createSessionResponse = {
      id: 'mockSessionId',
    };

    queueMock(versionResponse);
    queueMock(createSessionResponse);

    const response = createSession({ pan });

    // mock event from method notification
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { methodCompleted: true, id: 'mockSessionId' },
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
      methodUrl: 'mockMethodUrl',
      notificationUrl: 'http://test.com',
    };

    const createSessionResponse = {
      id: 'mockSessionId',
    };

    queueMock(versionResponse);
    queueMock(createSessionResponse);

    const res = createSession({ pan });

    jest.advanceTimersByTime(10000);

    const response = await res;

    expect(response).toStrictEqual(createSessionResponse);
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
  });
});
