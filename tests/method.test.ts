import { BasisTheory3ds } from '~src/index';
import { startMethod } from '~src/method';
import { ACS_MODE, METHOD_REQUEST } from '~src/constants';

jest.mock('~src/utils/logging', () => ({
  configureLogger: jest.fn(),
  logger: { log: { error: jest.fn(), info: jest.fn() } },
}));

const request = {
  sessionId: 'existing-session',
  methodUrl: 'https://issuer.example/method',
  methodNotificationUrl:
    'https://api.example/3ds/sessions/existing-session/method-notification',
};

const originalFetch = global.fetch;

const methodFrame = () =>
  document.getElementById(METHOD_REQUEST.IFRAME_NAME) as HTMLIFrameElement;

const notification = (overrides: MessageEventInit = {}) =>
  new MessageEvent('message', {
    data: { type: 'method', id: request.sessionId, isCompleted: true },
    origin: 'https://3ds.example',
    source: methodFrame()?.contentWindow,
    ...overrides,
  });

beforeEach(() => {
  jest.useFakeTimers();
  document.body.innerHTML = '';
  BasisTheory3ds('test-key', {
    sdkBaseUrl: 'https://3ds.example',
    disableTelemetry: true,
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('exposes Method execution for an existing session without creating another session', async () => {
  const sdk = BasisTheory3ds('test-key', {
    sdkBaseUrl: 'https://3ds.example',
    disableTelemetry: true,
  });
  const fetch = jest.fn();
  global.fetch = fetch;
  const promise = sdk.startMethod(request);
  const frame = methodFrame();
  const postMessage = jest.spyOn(frame.contentWindow!, 'postMessage');

  frame.dispatchEvent(new Event('load'));

  expect(frame.src).toBe('https://3ds.example/pages/method.html?v=2');
  const [message, origin] = postMessage.mock.calls[0];
  expect(origin).toBe('https://3ds.example');
  expect(message.type).toBe('startMethod');
  expect(message.threeDSMethodURL).toBe(request.methodUrl);
  expect(JSON.parse(atob(message.threeDSMethodData))).toEqual({
    threeDSServerTransID: request.sessionId,
    threeDSMethodNotificationURL: request.methodNotificationUrl,
  });

  window.dispatchEvent(notification());

  await expect(promise).resolves.toEqual({ isCompleted: true });
  expect(fetch).not.toHaveBeenCalled();
});

test('waits for the matching Method callback and cleans up after completion', async () => {
  const add = jest.spyOn(window, 'addEventListener');
  const remove = jest.spyOn(window, 'removeEventListener');
  const promise = startMethod(request);
  const listener = add.mock.calls.find(([type]) => type === 'message')![1];
  let settled = false;
  void promise.then(() => {
    settled = true;
  });

  await jest.advanceTimersByTimeAsync(2500);
  expect(settled).toBe(false);
  expect(methodFrame()).not.toBeNull();
  window.dispatchEvent(notification());

  await expect(promise).resolves.toEqual({ isCompleted: true });
  expect(methodFrame()).toBeNull();
  expect(remove).toHaveBeenCalledWith('message', listener);
  expect(jest.getTimerCount()).toBe(0);
});

test('continues after exactly ten seconds when no callback arrives, even if the iframe never loads', async () => {
  const remove = jest.spyOn(window, 'removeEventListener');
  const promise = startMethod(request);
  let settled = false;
  void promise.then(() => {
    settled = true;
  });

  await jest.advanceTimersByTimeAsync(9999);
  expect(settled).toBe(false);
  await jest.advanceTimersByTimeAsync(1);

  await expect(promise).resolves.toEqual({ isCompleted: false });
  expect(methodFrame()).toBeNull();
  expect(remove).toHaveBeenCalledWith('message', expect.any(Function));
  expect(jest.getTimerCount()).toBe(0);
});

test('ignores other sessions, challenge events, and messages from the wrong window or origin', async () => {
  const promise = startMethod(request);
  let settled = false;
  void promise.then(() => {
    settled = true;
  });

  window.dispatchEvent(
    notification({
      data: { type: 'method', id: 'another-session', isCompleted: true },
    })
  );
  window.dispatchEvent(
    notification({
      data: { type: 'challenge', id: request.sessionId, isCompleted: true },
    })
  );
  window.dispatchEvent(notification({ source: window }));
  window.dispatchEvent(notification({ origin: 'https://unrelated.example' }));
  window.dispatchEvent(notification({ data: null }));
  await jest.advanceTimersByTimeAsync(0);
  expect(settled).toBe(false);

  window.dispatchEvent(notification());
  await expect(promise).resolves.toEqual({ isCompleted: true });
});

test('preserves an unsuccessful Method notification', async () => {
  const promise = startMethod(request);
  window.dispatchEvent(
    notification({
      data: { type: 'method', id: request.sessionId, isCompleted: false },
    })
  );
  await expect(promise).resolves.toEqual({ isCompleted: false });
});

test.each(['sessionId', 'methodUrl', 'methodNotificationUrl'])(
  'rejects a missing %s before starting Method',
  async (field) => {
    await expect(startMethod({ ...request, [field]: '' })).rejects.toThrow(
      'are required'
    );
    expect(methodFrame()).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  }
);

test('removes the listener and timer when the iframe cannot be created', async () => {
  const remove = jest.spyOn(window, 'removeEventListener');
  const container = document.getElementById(METHOD_REQUEST.FRAME_CONTAINER_ID)!;
  jest.spyOn(container, 'appendChild').mockImplementation(() => {
    throw new Error('iframe unavailable');
  });

  await expect(startMethod(request)).rejects.toThrow('iframe unavailable');
  expect(remove).toHaveBeenCalledWith('message', expect.any(Function));
  expect(jest.getTimerCount()).toBe(0);
});

test('cleans up the deprecated redirect flow when its window closes', async () => {
  const popup = { closed: false } as Window;
  jest.spyOn(window, 'open').mockReturnValue(popup);
  jest
    .spyOn(HTMLFormElement.prototype, 'submit')
    .mockImplementation(() => undefined);
  const promise = startMethod({
    ...request,
    methodRequestMode: ACS_MODE.REDIRECT,
  });
  const form = document.querySelector('form')!;
  const data = JSON.parse(
    atob(
      (form.elements.namedItem('threeDSMethodData') as HTMLInputElement).value
    )
  );
  expect(data.threeDSMethodNotificationURL).toBe(
    `${request.methodNotificationUrl}?mode=redirect`
  );

  Object.defineProperty(popup, 'closed', { value: true });
  await jest.advanceTimersByTimeAsync(500);

  await expect(promise).resolves.toEqual({ isCompleted: false });
  expect(document.querySelector('form')).toBeNull();
  expect(jest.getTimerCount()).toBe(0);
});

test('accepts the deprecated popup callback only from the notification origin', async () => {
  const popupFrame = document.createElement('iframe');
  document.body.appendChild(popupFrame);
  const popup = popupFrame.contentWindow!;
  jest.spyOn(window, 'open').mockReturnValue(popup);
  jest
    .spyOn(HTMLFormElement.prototype, 'submit')
    .mockImplementation(() => undefined);
  const promise = startMethod({
    ...request,
    methodRequestMode: ACS_MODE.REDIRECT,
  });
  let settled = false;
  void promise.then(() => {
    settled = true;
  });

  window.dispatchEvent(
    notification({ source: popup, origin: 'https://issuer.example' })
  );
  await jest.advanceTimersByTimeAsync(0);
  expect(settled).toBe(false);
  window.dispatchEvent(
    notification({ source: popup, origin: 'https://api.example' })
  );

  await expect(promise).resolves.toEqual({ isCompleted: true });
  expect(document.querySelector('form')).toBeNull();
  expect(jest.getTimerCount()).toBe(0);
});

test('continues if the deprecated Method popup is blocked', async () => {
  jest.spyOn(window, 'open').mockReturnValue(null);
  await expect(
    startMethod({ ...request, methodRequestMode: ACS_MODE.REDIRECT })
  ).resolves.toEqual({ isCompleted: false });
  expect(jest.getTimerCount()).toBe(0);
});
