/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const camelToSnakeCase = <T extends Record<string, any>>(
  obj: T
): Record<string, any> => {
  const newObj: Record<string, any> = {};

  Object.keys(obj).forEach((key) => {
    const snakeCaseKey = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    newObj[snakeCaseKey] = obj[key];
  });

  return newObj;
};

