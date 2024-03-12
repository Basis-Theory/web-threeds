import { logger } from './logging';

const isHTMLElement = (obj: unknown): obj is HTMLElement =>
  !obj || obj instanceof HTMLElement;

const createIframe = (
  container: HTMLElement | null,
  name: string,
  id: string,
  width = '0',
  height = '0',
  onLoadCallback?: GlobalEventHandlers['onload']
) => {
  if (!isHTMLElement(container) || !name || !id) {
    const msg = `Unable to create iframe. Container must be a HTML element ${JSON.stringify(container)} ${name} ${id}`;

    logger.log.error(`Unable to create iframe`, new Error());

    throw Error(msg);
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

const createForm = (
  formName: string,
  formAction: string,
  formTarget: string
) => {
  const form = document.createElement('form');
  form.name = formName;
  form.action = formAction;
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

const removeIframe = (ids?: string[]) =>
  ids?.map((id) => document.getElementById(id)?.remove());

export {
  createElement,
  createForm,
  createIframe,
  createIframeContainer,
  createInput,
  removeIframe,
};
