import {
  WindowSizeId,
  getDeviceInfo,
  getWindowSizeById,
} from '~src/utils/browser';

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

describe('getDeviceInfo', () => {
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

    expect(result).toEqual({
      browserColorDepth: '32',
      browserJavascriptEnabled: true,
      browserJavaEnabled: true,
      browserLanguage: 'en-US',
      browserScreenHeight: '1080',
      browserScreenWidth: '1920',
      browserTZ: '240',
      browserUserAgent: 'Test User Agent',
    });
  });
});

describe('getWindowSizeById', () => {
  it('should return the correct window size for a given id', () => {
    const result = getWindowSizeById(WindowSizeId.THREE);

    expect(result).toEqual(['500px', '600px']);
  });

  it('should throw an error for an invalid window size id', async () => {
    const invalidSizeId = '06' as WindowSizeId;

    expect(() => getWindowSizeById(invalidSizeId)).toThrow(
      `Window size ${invalidSizeId} is not supported`
    );
  });
});
