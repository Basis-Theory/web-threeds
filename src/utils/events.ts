export enum NotificationType {
  METHOD = 'method',
  CHALLENGE = 'challenge',
  METHOD_TIME_OUT = 'methodTimeout',
  START_METHOD_TIME_OUT = 'startMethodTimeout',
  ERROR = 'error',
}

export type Notification = {
  // whether the event was completed succesfully
  isCompleted: boolean;
  // id associated to the event
  id: string;
  type: NotificationType;
  // additional event info (detailed errors)
  details?: string;
};

export const notify = (notification: Notification) =>
  window.postMessage(notification, '*');

export const isNotification = (obj: unknown): obj is Notification =>
  typeof obj === 'object' &&
  obj !== null &&
  'isCompleted' in obj &&
  typeof obj.isCompleted === 'boolean' &&
  'id' in obj &&
  typeof obj.id === 'string' &&
  'type' in obj &&
  Object.values(NotificationType).includes((obj as Notification).type);
