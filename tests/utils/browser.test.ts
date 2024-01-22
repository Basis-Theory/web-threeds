import {
  WindowSizeId,
  getDeviceInfo,
  getWindowSizeById,
} from '@/utils/browser';
import { logger } from '@/utils/logging';

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

jest.mock('@/utils/logging', () => ({
  logger: {
    ...logger,
    log: {
      ...logger.log,
      error: jest.fn(),
    },
  },
}));

afterAll(() => {
  Object.defineProperty(global, 'window', {
    value: originalWindow,
  });
});

describe('getDeviceInfo', () => {
  it('should return the correct device info', () => {
    Object.defineProperty(global, 'window', {
      value: {
        ...global.window,
        screen: mockWindow.screen,
        navigator: mockWindow.navigator,
      },
    });

    const result = getDeviceInfo();

    expect(result).toEqual({
      browserColorDepth: '32',
      browserJavascriptEnabled: true,
      browserJavaEnabled: true,
      browserLanguage: 'en-US',
      browserScreenHeight: '1080',
      browserScreenWidth: '1920',
      browserTZ: '360',
      browserUserAgent: 'Test User Agent',
    });
  });
});

describe('getWindowSizeById', () => {
  it('should return the correct window size for a given id', () => {
    const result = getWindowSizeById('03');

    expect(result).toEqual(['500px', '600px']);
  });

  it('should throw an error for an unsupported window size', () => {
    const unsupportedSize = '06' as WindowSizeId; // casting to make it a valid id

    expect(() => {
      getWindowSizeById(unsupportedSize);
    }).toThrow(`Window size ${unsupportedSize} is not supported`);
  });
});
