export enum NotificationType {
  METHOD = 'method',
  CHALLENGE = 'challenge',
  METHOD_TIME_OUT = 'methodTimeout',
}

export type Notification = {
  isCompleted: boolean;
  id: string;
  type: NotificationType;
};

export const isNotification = (obj: unknown): obj is Notification =>
  typeof obj === 'object' &&
  obj !== null &&
  'isCompleted' in obj &&
  typeof obj.isCompleted === 'boolean' &&
  'id' in obj &&
  typeof obj.id === 'string' &&
  'type' in obj &&
  Object.values(NotificationType).includes((obj as Notification).type);
