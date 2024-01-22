export const encode = <T extends Record<keyof T, unknown>>(obj: T) =>
  btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
