import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { encode } from '~src/utils/encoding';

const script = readFileSync(
  join(__dirname, '../src/pages/method.html'),
  'utf8'
).match(/<script>([\s\S]*?)<\/script>/)![1];
const methodData = encode({
  threeDSServerTransID: 'existing-session',
  threeDSMethodNotificationURL: 'https://api.example/notify',
});
const request = {
  type: 'startMethod',
  threeDSMethodURL: 'https://issuer.example/method',
  threeDSMethodData: methodData,
};

function relay() {
  const parent = { postMessage: jest.fn() };
  let receive: (event: Record<string, unknown>) => void;
  runInNewContext(script, {
    document,
    URL,
    atob,
    window: {
      parent,
      addEventListener: (_: string, handler: typeof receive) => {
        receive = handler;
      },
    },
  });
  return {
    parent,
    start: (data = request, source: unknown = parent) =>
      receive({ data, source, origin: 'https://merchant.example' }),
    notify: (overrides: Record<string, unknown> = {}) =>
      receive({
        source: document.querySelector('iframe')?.contentWindow,
        origin: 'https://api.example',
        data: {
          type: 'method',
          id: 'existing-session',
          isCompleted: true,
        },
        ...overrides,
      }),
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
  jest
    .spyOn(HTMLFormElement.prototype, 'submit')
    .mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

test('submits the existing Method payload and relays its notification to the parent origin', () => {
  const page = relay();
  page.start();
  const form = document.querySelector('form')!;
  expect(form.action).toBe(request.threeDSMethodURL);
  expect(
    (form.elements.namedItem('threeDSMethodData') as HTMLInputElement).value
  ).toBe(methodData);

  page.notify();

  expect(page.parent.postMessage).toHaveBeenCalledWith(
    { type: 'method', id: 'existing-session', isCompleted: true },
    'https://merchant.example'
  );
});

test('does not forward issuer messages or notifications from the wrong frame or session', () => {
  const page = relay();
  page.start();
  page.notify({ origin: 'https://issuer.example' });
  page.notify({ source: page.parent });
  page.notify({
    data: { type: 'method', id: 'other-session', isCompleted: true },
  });
  page.notify({
    data: { type: 'challenge', id: 'existing-session', isCompleted: true },
  });
  page.notify({
    data: { type: 'method', id: 'existing-session', isCompleted: 'true' },
  });
  page.notify({ data: null });
  expect(page.parent.postMessage).not.toHaveBeenCalled();

  page.notify();
  expect(page.parent.postMessage).toHaveBeenCalledTimes(1);
});

test('accepts only the first Method request from the parent window', () => {
  const page = relay();
  page.start(request, window);
  expect(document.querySelector('iframe')).toBeNull();

  page.start();
  page.start();
  expect(document.querySelectorAll('iframe')).toHaveLength(1);
  expect(HTMLFormElement.prototype.submit).toHaveBeenCalledTimes(1);
});

test.each(['invalid-base64', encode({ threeDSServerTransID: 'session' })])(
  'rejects invalid Method data before creating an issuer iframe (%s)',
  (threeDSMethodData) => {
    const page = relay();
    page.start({ ...request, threeDSMethodData });
    expect(document.querySelector('iframe')).toBeNull();
    expect(page.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
      'https://merchant.example'
    );
  }
);
