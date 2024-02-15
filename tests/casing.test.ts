import {
  WindowSizeId,
  getDeviceInfo,
  getWindowSizeById,
} from '~src/utils/browser';
import { camelToSnakeCase } from '~src/utils/casing';

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

    const convertedResult = camelToSnakeCase(result);

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
