import {
  createElement,
  createForm,
  createIframe,
  createIframeContainer,
  createInput,
} from '@/utils/dom';

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
    const form = createForm('testForm', '_blank');

    window.location.host;

    expect(form.tagName).toBe('FORM');
    expect(form.name).toBe('testForm');
    // expect(form.action).toBe(`${window.location.href}submit`);
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
