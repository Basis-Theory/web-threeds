import { logger } from '../utils/logging';

const isHTMLElement = (obj: unknown): obj is HTMLElement =>
  obj instanceof HTMLElement;

const createIframe = async (
  container: HTMLElement | null,
  name: string,
  id: string,
  width = '0',
  height = '0',
  onLoadCallback?: GlobalEventHandlers['onload']
) => {
  if (!container || !name || !id) {
    const msg = `${container?.id} ${name} ${id}`;
    await logger.log.error(
      `Not all required fields have a value`,
      new Error(msg)
    );
    throw Error('Container must be a HTML element');
  }

  if (!isHTMLElement(container)) {
    await logger.log.error(
      `Container must be a HTML element`,
      new Error(JSON.stringify(container))
    );
    throw Error('Container must be a HTML element');
  }

  const iframe = document.createElement('iframe');

  iframe.name = name;
  iframe.width = width;
  iframe.height = height;
  iframe.setAttribute('id', id);
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('border', '0');

  if (onLoadCallback && typeof onLoadCallback === 'function') {
    iframe.addEventListener('onload', onLoadCallback);
  }

  container.appendChild(iframe);
  return iframe;
};

const createForm = (formName: string, formTarget: string) => {
  const form = document.createElement('form');
  form.name = formName;
  form.method = 'POST';
  form.target = formTarget;

  return form;
};

const createInput = (name: string, value: string) => {
  const input = document.createElement('input');
  input.name = name;
  input.value = value;
  return input;
};

const createElement = (tagName: string, child: Node) => {
  const element = document.createElement(tagName);
  element.appendChild(child);
  return element;
};

const createIframeContainer = (id: string) => {
  const container = document.createElement('div');
  container.id = id;

  document.body.appendChild(container);
};

export {
  createElement,
  createForm,
  createIframe,
  createIframeContainer,
  createInput,
};
