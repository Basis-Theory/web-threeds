import { CHALLENGE_REQUEST, METHOD_REQUEST } from '~src/constants';
import {
  createElement,
  createForm,
  createIframe,
  createIframeContainer,
  createInput,
  removeIframeContainer,
} from '~src/utils/dom';
import { NotificationType } from '~src/utils/events';

describe('Utility Functions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('createElement should create an element with a child', () => {
    const child = document.createElement('span');
    const element = createElement('div', child);

    expect(element.children.length).toBe(1);
    expect(element.firstChild).toBe(child);
  });

  test('createForm should create a form element', () => {
    const form = createForm(
      'testForm',
      `${window.location.href}submit`,
      '_blank'
    );

    window.location.host;

    expect(form.tagName).toBe('FORM');
    expect(form.name).toBe('testForm');
    expect(form.action).toBe(`${window.location.href}submit`);
    expect(form.method).toBe('post');
    expect(form.target).toBe('_blank');
  });

  test('createIframe should create an iframe element', () => {
    const container = document.createElement('div');
    createIframe(container, 'iframeName', 'iframeId');

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeDefined();
    expect(iframe!.name).toBe('iframeName');
    expect(iframe!.id).toBe('iframeId');
  });

  test('createIframeContainer should create a div container', () => {
    createIframeContainer('containerId');

    const container = document.getElementById('containerId');
    expect(container).toBeDefined();
    expect(container!.tagName).toBe('DIV');
  });

  test('createInput should create an input element', () => {
    const input = createInput('inputName', 'inputValue');

    expect(input.tagName).toBe('INPUT');
    expect(input.name).toBe('inputName');
    expect(input.value).toBe('inputValue');
  });
});

describe('iframe container creation and removal', () => {
  test.each([
    [
      `${METHOD_REQUEST.FRAME_CONTAINER_ID} should be removed when notification is ${NotificationType.METHOD}`,
      METHOD_REQUEST.FRAME_CONTAINER_ID,
    ],
    [
      `${METHOD_REQUEST.FRAME_CONTAINER_ID} should be removed when notification is ${NotificationType.METHOD_TIME_OUT}`,
      METHOD_REQUEST.FRAME_CONTAINER_ID,
    ],
    [
      `${METHOD_REQUEST.FRAME_CONTAINER_ID} should be removed when notification is ${NotificationType.ERROR}`,
      METHOD_REQUEST.FRAME_CONTAINER_ID,
    ],
    [
      `${CHALLENGE_REQUEST.FRAME_CONTAINER_ID} should be removed when notification is ${NotificationType.CHALLENGE}`,
      CHALLENGE_REQUEST.FRAME_CONTAINER_ID,
    ],
    [
      `${CHALLENGE_REQUEST.FRAME_CONTAINER_ID} should be removed when notification is ${NotificationType.ERROR}`,
      CHALLENGE_REQUEST.FRAME_CONTAINER_ID,
    ],
  ])('%s', (_, frameId) => {
    createIframeContainer(frameId);

    expect(document.getElementById(frameId)).not.toBeNull();

    removeIframeContainer([frameId]);

    expect(document.getElementById(frameId)).toBeNull();
  });
});
