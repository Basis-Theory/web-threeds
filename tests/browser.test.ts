import {
  WindowSizeId,
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
