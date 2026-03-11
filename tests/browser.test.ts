import {
  WindowSizeId,
  detectWebView,
  getDeviceInfo,
  getWindowSizeById,
  trimLanguageCode,
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

describe('trimLanguageCode', () => {
  it('should return language code as-is when it has only language part', () => {
    expect(trimLanguageCode('en')).toBe('en');
    expect(trimLanguageCode('fr')).toBe('fr');
  });

  it('should return language code as-is when it has language and region', () => {
    expect(trimLanguageCode('en-US')).toBe('en-US');
    expect(trimLanguageCode('en-GB')).toBe('en-GB');
    expect(trimLanguageCode('fr-FR')).toBe('fr-FR');
  });

  it('should strip variant from language code with 3 parts', () => {
    expect(trimLanguageCode('en-GB-oxendict')).toBe('en-GB');
    expect(trimLanguageCode('zh-CN-u-co-pinyin')).toBe('zh-CN');
  });

  it('should strip multiple variants from language code', () => {
    expect(trimLanguageCode('en-US-x-twain-u-co-phonebk')).toBe('en-US');
  });

  it('should handle empty or undefined language codes', () => {
    expect(trimLanguageCode('')).toBe('');
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

  it('should normalize language code with variants', () => {
    Object.defineProperty(global, 'window', {
      value: {
        ...global.window,
        screen: mockWindow.screen,
        navigator: {
          ...mockWindow.navigator,
          language: 'en-GB-oxendict',
        },
      },
    });

    const result = getDeviceInfo();

    expect(result.browserLanguage).toBe('en-GB');
  });
});

describe('detectWebView', () => {
  const setUserAgent = (ua: string) => {
    Object.defineProperty(global, 'window', {
      value: {
        ...global.window,
        navigator: { ...global.window.navigator, userAgent: ua },
      },
    });
  };

  afterEach(() => {
    delete (window as any).ReactNativeWebView;
  });

  it('should detect React Native WebView', () => {
    (window as any).ReactNativeWebView = {};
    expect(detectWebView()).toBe(true);
  });

  it('should detect Android WebView via wv flag', () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 11; Pixel 5 Build/RQ3A.210805.001.A1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.159 Mobile Safari/537.36'
    );
    expect(detectWebView()).toBe(true);
  });

  it('should detect generic Android WebView without Chrome', () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36'
    );
    expect(detectWebView()).toBe(true);
  });

  it('should detect iOS WKWebView without Safari token', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
    );
    expect(detectWebView()).toBe(true);
  });

  it('should return false for regular desktop browser', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    expect(detectWebView()).toBe(false);
  });

  it('should return false for regular Mobile Safari', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    );
    expect(detectWebView()).toBe(false);
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
