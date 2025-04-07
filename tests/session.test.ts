import { ACS_MODE, METHOD_REQUEST } from '~src/constants';
import { createSession } from '~src/session';
import { createIframeContainer } from '~src/utils/dom';
import { http } from '~src/utils/http';

let fetchMocksQueue: Record<string, unknown>[] = [];
let fetchMockCalls: any[] = [];

const queueMock = (
  responseData?: Record<string, unknown>,
  ok: boolean = true,
  status: number = ok ? 200 : 400
) => {
  fetchMocksQueue.push({
    ok,
    status,
    json: () => Promise.resolve(responseData),
  });
};

const resetMockQueue = () => {
  fetchMocksQueue = [];
  fetchMockCalls = [];
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
    global.fetch = jest.fn((...args) => {
      fetchMockCalls.push(args);
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

    const tokenId = 'mockId';

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

    const response = createSession({ tokenId });

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

    const tokenId = 'mockId';

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

    const res = createSession({ tokenId });

    await resolvePendingPromises();

    const response = await res;

    expect(response).toStrictEqual(createSessionResponse);
    expect(setTimeout).toHaveBeenCalled();
  }, 10001);

  it('should handle the case where version methodUrl is not available', async () => {
    const versionResponse = {
      id: 'mockSessionId',
      cardBrand: 'visa',
      methodUrl: undefined,
    };

    const tokenId = 'tokenId';

    queueMock(versionResponse);
    queueMock(undefined);

    const response = await createSession({ tokenId });

    expect(response).toStrictEqual({ cardBrand: 'visa', id: 'mockSessionId' });
    expect(setTimeout).not.toHaveBeenCalled();
  });

  it('should handle API errors and return custom error messages', async () => {
    const tokenId = 'mockId';

    const errorResponse = {
      errors: {
        'The card was not supported by any card schemes': [
          'Cardholder Account Number is not in a range belonging to Issuer.',
        ],
      },
      title: '3DS Service Validation Error',
      status: 400,
      detail: "Check the 'errors' property for more details",
    };

    // Simulate an error response from the API
    queueMock(errorResponse, false, 400);

    await expect(createSession({ tokenId })).rejects.toEqual(
      '3DS is not supported for the provided card'
    );
  });

  it('should throw the original error title for unmapped errors', async () => {
    const tokenId = 'mockId';

    const errorResponse = {
      errors: {
        'Some unknown error': ['An unexpected error occurred.'],
      },
      title: 'Unknown Error',
      status: 500,
      detail: 'An unexpected error occurred.',
    };

    queueMock(errorResponse, false, 500);

    await expect(createSession({ tokenId })).rejects.toEqual('Unknown Error');
  });

  it('should handle 3DS service errors with message and details', async () => {
    const tokenId = 'mockId';

    const errorResponse = {
      title: '3DS Service Error',
      status: 424,
      detail: 'The 3DS service returned an error. See the \'error\' field for more details.',
      error: {
        serviceStatus: 'ERROR',
        sessionId: '',
        errorSource: 'ACS',
        message: 'Authentication failed',
        details: 'Cardholder authentication failed'
      }
    };

    queueMock(errorResponse, false, 424);

    await expect(createSession({ tokenId })).rejects.toEqual(
      'Authentication failed - details: Cardholder authentication failed'
    );
  });

  it('should handle 3DS service errors with only message', async () => {
    const tokenId = 'mockId';

    const errorResponse = {
      title: '3DS Service Error',
      status: 424,
      detail: 'The 3DS service returned an error. See the \'error\' field for more details.',
      error: {
        serviceStatus: '401',
        sessionId: '',
        errorSource: 'Access Control Server',
        message: 'Authentication failed'
      }
    };

    queueMock(errorResponse, false, 424);

    await expect(createSession({ tokenId })).rejects.toEqual('Authentication failed');
  });

  it('should send tokenId in the request if tokenId is provided', async () => {
    const tokenId = 'mockTokenId';

    const createSessionResponse = {
      id: 'mockSessionId',
      cardBrand: 'visa',
    };

    queueMock(createSessionResponse);

    const response = await createSession({ tokenId: tokenId });

    await resolvePendingPromises();

    expect(response).toStrictEqual(createSessionResponse);

    const requestBody = JSON.parse(fetchMockCalls[0][1].body);
    expect(requestBody).toHaveProperty('token_id', tokenId);
  });

  it('should send tokenIntentId in the request if tokenIntentId is provided', async () => {
    const tokenIntentId = 'mockTokenIntentId';

    const createSessionResponse = {
      id: 'mockSessionId',
      cardBrand: 'visa',
    };

    queueMock(createSessionResponse);

    const response = await createSession({ tokenIntentId: tokenIntentId });

    await resolvePendingPromises();

    expect(response).toStrictEqual(createSessionResponse);

    const requestBody = JSON.parse(fetchMockCalls[0][1].body);
    expect(requestBody).toHaveProperty('token_intent_id', tokenIntentId);
  });

  it('should throw an error if more than one of tokenId, tokenIntentId or pan is provided', async () => {
    const tokenId = 'mockTokenId';
    const tokenIntentId = 'mockTokenIntentId';

    await expect(createSession({ tokenId, tokenIntentId })).rejects.toEqual(
      'Only one of pan, tokenId, or tokenIntentId should be provided.'
    );
  });

  it('should throw an error if no params are included', async () => {
    await expect(createSession({})).rejects.toEqual(
      'One of pan, tokenId, or tokenIntentId is required.'
    );
  });

  /**
   * @deprecated `pan` has been deprecated in favor of tokenId
   */
  it('should send pan in the request if pan is provided', async () => {
    const pan = 'mockTokenid';

    const createSessionResponse = {
      id: 'mockSessionId',
      cardBrand: 'visa',
    };

    queueMock(createSessionResponse);

    const response = await createSession({ pan });

    await resolvePendingPromises();

    expect(response).toStrictEqual(createSessionResponse);

    const requestBody = JSON.parse(fetchMockCalls[0][1].body);
    expect(requestBody).toHaveProperty('pan', pan);
  });

  it('should open a new window and poll for closure if methodUrl is available and methodMode=redirect', async () => {
    window.HTMLFormElement.prototype.submit = jest.fn();

    // mock open window reference
    const mockPopup: Partial<Window> = { closed: false };
    const mockWindowOpen = jest
      .spyOn(window, 'open')
      .mockImplementation(() => mockPopup as Window);

    const versionResponse = {
      id: 'mockSessionId',
      cardBrand: 'visa',
      methodUrl: 'mockMethodUrl',
      methodNotificationUrl: 'http://test.com/notify',
    };
    const createSessionResponse = {
      id: 'mockSessionId',
      cardBrand: 'visa',
    };

    queueMock(versionResponse);
    queueMock(createSessionResponse);

    // change method mode to redirect
    const sessionPromise = createSession({
      tokenId: 'mockId',
      methodRequestMode: ACS_MODE.REDIRECT,
    });

    await resolvePendingPromises();

    expect(mockWindowOpen).toHaveBeenCalledWith('', 'threeDSMethodForm');
    (mockPopup.closed as boolean) = true; // mock window closing

    const session = await sessionPromise;
    expect(session).toStrictEqual(createSessionResponse);

    mockWindowOpen.mockRestore();
  });

  it('should skip 3DS method request if skipMethodRequest = true', async () => {
    window.HTMLFormElement.prototype.submit = jest.fn();

    createIframeContainer(METHOD_REQUEST.FRAME_CONTAINER_ID);

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

    // set skipMethodRequest to true
    const sessionPromise = createSession({
      tokenId: 'mockId',
      skipMethodRequest: true,
    });

    await resolvePendingPromises();

    const session = await sessionPromise;

    expect(session).toStrictEqual(createSessionResponse);

    // assert no form submission happened
    expect(window.HTMLFormElement.prototype.submit).not.toHaveBeenCalled();
  });
});
