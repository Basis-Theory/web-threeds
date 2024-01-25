import { METHOD_REQUEST } from '../src/constants';
import { createSession } from '../src/session';
import { createIframeContainer } from '../src/utils/dom';

let fetchMocksQueue: Record<string, unknown>[] = [];

const queueMock = (responseData?: Record<string, unknown>) => {
  fetchMocksQueue.push({
    ok: true,
    json: () => Promise.resolve(responseData),
  });
};

describe('createSession', () => {
  beforeAll(() => {
    // @ts-expect-error
    global.fetch = jest.fn(() => {
      if (fetchMocksQueue.length === 0) {
        throw new Error('No more fetch mocks in the queue.');
      }
      return Promise.resolve(fetchMocksQueue.shift());
    });
  });

  afterAll(() => {
    // @ts-expect-error
    global.fetch = undefined;
    fetchMocksQueue = [];
  });

  it('should create a session and send method request if version methodUrl is available', async () => {
    createIframeContainer(METHOD_REQUEST.FRAME_CONTAINER_ID);

    const apiKey = 'mockApiKey';
    const pan = 'mockPan';

    const versionResponse = {
      sessionId: 'mockSessionId',
      methodUrl: 'mockMethodUrl',
    };

    const methodResponse = {
      thisShouldBeReturnedByTheAcs: true,
    };

    queueMock(versionResponse);
    queueMock(methodResponse);

    const response = await createSession(apiKey)({ pan });

    expect(response).toBe(methodResponse);
  });

  it('should handle the case where version methodUrl is not available', async () => {
    const versionResponse = {
      sessionId: 'mockSessionId',
      methodUrl: undefined,
    };

    const apiKey = 'mockApiKey';
    const pan = 'mockPan';

    queueMock(versionResponse);
    queueMock(undefined);

    const result = await createSession(apiKey)({ pan });

    expect(result).toBeUndefined();
  });
});
