import { logger } from './logging';

export enum WindowSizeId {
  ONE = '01',
  TWO = '02',
  THREE = '03',
  FOUR = '04',
  FIVE = '05',
}

export type ThreeDSDeviceInfo = {
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
};

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

export const getWindowSizeById = (
  challengeWindowSize: WindowSizeId = WindowSizeId.FIVE
) => {
  const sizeMap: Record<WindowSizeId, [string, string]> = {
    [WindowSizeId.ONE]: ['250px', '400px'],
    [WindowSizeId.TWO]: ['390px', '400px'],
    [WindowSizeId.THREE]: ['500px', '600px'],
    [WindowSizeId.FOUR]: ['600px', '400px'],
    [WindowSizeId.FIVE]: ['100%', '100%'],
  };

  const size = sizeMap[challengeWindowSize];

  if (size) {
    return size;
  } else {
    const err = new Error(
      `Window size ${challengeWindowSize} is not supported`
    );

    logger.log.error('Unsupported window size', err);

    throw err;
  }
};
