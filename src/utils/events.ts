import { isObject } from '.';

type ChallengeNotification = {
  challengeCompleted: boolean;
  status: string;
};

export type MethodNotification = {
  methodCompleted: boolean;
  id: string;
};

export type MethodNotificationTimedOut = {
  methodTimedOut: boolean;
  id: string;
};

export const isMethodCompleted = (obj: unknown): obj is MethodNotification =>
  isObject(obj) &&
  'methodCompleted' in (obj as MethodNotification) &&
  typeof (obj as MethodNotification).methodCompleted === 'boolean' &&
  'id' in (obj as MethodNotification) &&
  typeof (obj as MethodNotification).id === 'string';

export const isMethodTimedOut = (
  obj: unknown
): obj is MethodNotificationTimedOut =>
  isObject(obj) &&
  'methodTimedOut' in (obj as MethodNotificationTimedOut) &&
  typeof (obj as MethodNotificationTimedOut).methodTimedOut === 'boolean' &&
  'id' in (obj as MethodNotificationTimedOut) &&
  typeof (obj as MethodNotificationTimedOut).id === 'string';

export const isChallengeCompleted = (
  obj: unknown
): obj is ChallengeNotification =>
  'challengeCompleted' in (obj as ChallengeNotification) &&
  typeof (obj as ChallengeNotification).challengeCompleted === 'boolean' &&
  'status' in (obj as ChallengeNotification) &&
  typeof (obj as ChallengeNotification).status === 'string';
