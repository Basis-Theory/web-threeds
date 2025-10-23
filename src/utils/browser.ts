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

const stringifyValue = <T>(val: T): string => {
  if (val === null || val === undefined) {
    return '';
  }
  return JSON.stringify(val);
};

export const getColorDepth = () => {
  const validColorDepths = [1, 4, 8, 15, 16, 24, 32, 48];

  const actualColorDepth = window.screen.colorDepth;
  const possibleValues = validColorDepths.filter(
    (val) => val <= actualColorDepth
  );

  if (possibleValues.length === 0) return validColorDepths[0];

  return Math.max(...possibleValues);
};

/**
 * Trims browser language code to include only language and region.
 * Handles cases like 'en-GB-oxendict' and returns 'en-GB'.
 * Also handles simple language codes like 'en' which are returned as-is.
 */
export const trimLanguageCode = (c: string) => c?.split("-").slice(0, 2).join("-");

export const getDeviceInfo = (): ThreeDSDeviceInfo => ({
  browserColorDepth: stringifyValue(getColorDepth()),
  browserJavascriptEnabled: true,
  browserJavaEnabled: window.navigator.javaEnabled(),
  browserLanguage: trimLanguageCode(window.navigator.language),
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
