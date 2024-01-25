import { logger } from './logging';

export type WindowSizeId = '01' | '02' | '03' | '04' | '05';

interface ThreeDSDeviceInfo {
  browserAcceptHeader?: string;
  browserColorDepth?: string;
  browserIp?: string;
  browserJavascriptEnabled?: boolean;
  browserJavaEnabled?: boolean;
  browserLanguage?: string;
  browserScreenHeight?: string;
  browserScreenWidth?: string;
  browserTZ?: string;
  browserUserAgent?: string;
}

const stringifyValue = <T>(val: T) => (val ? JSON.stringify(val) : 'test');

export const getDeviceInfo = (): ThreeDSDeviceInfo => ({
  browserColorDepth: stringifyValue(window.screen.colorDepth),
  browserJavascriptEnabled: true,
  browserJavaEnabled: window.navigator.javaEnabled(),
  browserLanguage: window.navigator.language,
  browserScreenHeight: stringifyValue(window.screen.height),
  browserScreenWidth: stringifyValue(window.screen.width),
  browserTZ: stringifyValue(new Date().getTimezoneOffset()),
  browserUserAgent: window.navigator.userAgent,
});

export const getWindowSizeById = async (
  challengeWindowSize: WindowSizeId = '05'
): Promise<[string, string]> => {
  const sizeMap: Record<WindowSizeId, [string, string]> = {
    '01': ['250px', '400px'],
    '02': ['390px', '400px'],
    '03': ['500px', '600px'],
    '04': ['600px', '400px'],
    '05': ['100%', '100%'],
  };

  const size = sizeMap[challengeWindowSize];
  if (size) {
    return size;
  } else {
    const err = new Error(
      `Window size ${challengeWindowSize} is not supported`
    );

    await logger.log.error('Unsupported window size', err);

    throw err;
  }
};
