type TransformKeyCase<
  S extends string,
  Case extends 'camel' | 'snake',
> = Case extends 'camel'
  ? S extends `${infer First}_${infer Rest}`
    ? `${First}${Capitalize<TransformKeyCase<Rest, 'camel'>>}`
    : S
  : S extends `${infer Start}${infer Rest}`
    ? `${Start extends Uppercase<Start> ? '_' : ''}${Lowercase<Start>}${TransformKeyCase<Rest, 'snake'>}`
    : S;

export type DeepTransformKeysCase<T, Case extends 'camel' | 'snake'> = T extends string
  ? TransformKeyCase<T, Case>
  : T extends object
    ? {
        [K in keyof T as K extends string
          ? TransformKeyCase<K, Case>
          : K]: DeepTransformKeysCase<T[K], Case>;
      }
    : T;

const convertCasing = <T>(
  obj: unknown,
  transformKey: (key: string) => string
): T => {
  const convertCase = (input: unknown): unknown => {
    if (typeof input === 'string') {
      return transformKey(input);
    }

    if (typeof input !== 'object' || input === null) {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map(convertCase);
    }

    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        transformKey(key),
        typeof value === 'object' || Array.isArray(value)
          ? convertCase(value)
          : value,
      ])
    );
  };

  return convertCase(obj) as T;
};

export const camelCaseToSnakeCase = <T>(
  obj: T
): DeepTransformKeysCase<T, 'snake'> =>
  convertCasing(obj, (val: string): string =>
    val.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
  );

export const snakeCaseToCamelCase = <T>(
  obj: T
): DeepTransformKeysCase<T, 'camel'> =>
  convertCasing(obj, (val: string): string =>
    val.replace(/_./g, (match) => match[1].toUpperCase())
  );
