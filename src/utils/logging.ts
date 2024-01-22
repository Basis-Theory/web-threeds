type AttributeMap = Record<string, string>;

export const logger = (() => {
  const ddTok = 'pubb96b84a13912504f4354f2d794ea4fab';

  const log = async (
    message: string,
    level: string,
    error?: Error,
    attributes: AttributeMap = {}
  ) => {
    const payload = {
      application: '3ds-web',
      ddsource: '3ds-web',
      service: '3DS Web',
      ...attributes,
      level,
      message:
        level === 'error' && error ? `${message}: ${error.message}` : message,
    };

    try {
      const response = await fetch(
        `https://http-intake.logs.datadoghq.com/v1/input/${ddTok}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      await response.json();
    } catch {
      // Do nothing
    }
  };

  return {
    log: {
      error: async (message: string, error: Error, attributes?: AttributeMap) =>
        log(message, 'error', error, attributes),
      info: async (message: string, attributes?: AttributeMap) =>
        log(message, 'info', undefined, attributes),
      warn: async (message: string, attributes?: AttributeMap) =>
        log(message, 'warn', undefined, attributes),
    },
  };
})();
