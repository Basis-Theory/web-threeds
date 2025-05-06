import { getDeviceInfo } from '~src/utils/browser';
import { camelCaseToSnakeCase, snakeCaseToCamelCase } from '~src/utils/casing';

const originalWindow = { ...global.window };

const mockWindow = {
  screen: {
    colorDepth: 32,
    height: 1080,
    width: 1920,
  },
  navigator: {
    javaEnabled: () => true,
    language: 'en-US',
    userAgent: 'Test User Agent',
  },
};

jest.mock('~src/utils/logging', () => ({
  logger: {
    log: {
      error: jest.fn(),
    },
  },
}));

afterAll(() => {
  Object.defineProperty(global, 'window', {
    value: originalWindow,
  });
});

// snakeCaseToCamelCase
describe.each([
  ['simple objects', { snake_case_key: 'value' }, { snakeCaseKey: 'value' }],
  [
    'nested objects',
    { nested_object: { nested_key: 'value' } },
    { nestedObject: { nestedKey: 'value' } },
  ],
  [
    'arrays of objects',
    [{ snake_case_key: 'value' }, { another_snake_case_key: 'value' }],
    [{ snakeCaseKey: 'value' }, { anotherSnakeCaseKey: 'value' }],
  ],
  [
    'arrays of strings',
    ['snake_case_string', 'another_snake_case_string'],
    ['snakeCaseString', 'anotherSnakeCaseString'],
  ],
  [
    'deeply nested objects',
    { level1: { level2: { snake_case_key: 'value' } } },
    { level1: { level2: { snakeCaseKey: 'value' } } },
  ],
  [
    'string values within nested objects',
    { nested_object: { nested_string_value: 'stringValue' } },
    { nestedObject: { nestedStringValue: 'stringValue' } },
  ],
  ['an empty object', {}, {}],
  ['an empty array', [], []],
  ['null', null, null],
  ['a number', 123, 123],
  ['a string', 'snake_case_string', 'snakeCaseString'],
  ['a boolean', true, true],
])(
  'should handle %s for snake case to camel case conversion',
  (scenario, input, expectedOutput) => {
    test(`${scenario}`, () => {
      expect(snakeCaseToCamelCase(input)).toEqual(expectedOutput);
    });
  }
);

// camelCaseToSnakeCase
describe.each([
  ['simple objects', { camelCaseKey: 'value' }, { camel_case_key: 'value' }],
  [
    'nested objects',
    { nestedObject: { camelCaseKey: 'value' } },
    { nested_object: { camel_case_key: 'value' } },
  ],
  [
    'arrays of objects',
    [
      { camelCaseKey: 'value' },
      { anotherCamelCaseKey: 'value' },
      {
        anotherCamelCaseKeyWithArrayValue: [
          { camelCaseKey: 'value' },
          { anotherCamelCaseKey: 'value' },
        ],
      },
    ],
    [
      { camel_case_key: 'value' },
      { another_camel_case_key: 'value' },
      {
        another_camel_case_key_with_array_value: [
          { camel_case_key: 'value' },
          { another_camel_case_key: 'value' },
        ],
      },
    ],
  ],
  [
    'arrays of strings',
    ['camelCaseString', 'anotherCamelCaseString'],
    ['camel_case_string', 'another_camel_case_string'],
  ],
  [
    'deeply nested objects',
    { level1: { level2: { camelCaseKey: 'value' } } },
    { level1: { level2: { camel_case_key: 'value' } } },
  ],
  [
    'non-alphanumeric characters in keys',
    { 'camelCase-Key123': 'value' },
    { 'camel_case-key123': 'value' },
  ],
  [
    'key starts with uppercase letter',
    { UpperCaseKey: 'value' },
    { upper_case_key: 'value' },
  ],
  [
    'key ends with uppercase letter',
    { keyWithUpperCaseA: 'value' },
    { key_with_upper_case_a: 'value' },
  ],
  [
    'consecutive uppercase letters are present',
    { keyWithABCD: 'value' },
    { key_with_abcd: 'value' },
  ],
  [
    'string starts with an uppercase letter',
    'UpperCaseString',
    'upper_case_string',
  ],
  [
    'string ends with an uppercase letter',
    'stringWithUpperCaseA',
    'string_with_upper_case_a',
  ],
  [
    'consecutive uppercase letters are present in a string',
    'stringWithABCD',
    'string_with_abcd',
  ],
  ['an empty object', {}, {}],
  ['an empty array', [], []],
  ['null', null, null],
  ['a number', 123, 123],
  ['a string', 'camelCaseString', 'camel_case_string'],
  ['a boolean', true, true],
])(
  'should handle %s for camel case to snake case conversion',
  (scenario, input, expectedOutput) => {
    test(`${scenario}`, () => {
      expect(camelCaseToSnakeCase(input)).toEqual(expectedOutput);
    });
  }
);

describe('change casing for device info', () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);
  });

  it('should return the correct device info', () => {
    Object.defineProperty(global, 'window', {
      value: {
        ...global.window,
        screen: mockWindow.screen,
        navigator: mockWindow.navigator,
      },
    });

    const result = getDeviceInfo();

    const convertedResult = camelCaseToSnakeCase(result);

    expect(convertedResult).toEqual({
      browser_color_depth: '32',
      browser_javascript_enabled: true,
      browser_java_enabled: true,
      browser_language: 'en-US',
      browser_screen_height: '1080',
      browser_screen_width: '1920',
      browser_tz: '240',
      browser_user_agent: 'Test User Agent',
    });
  });
});
