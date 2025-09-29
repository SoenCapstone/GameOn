
jest.mock('react-native-logs', () => {
  const instance = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const createLogger = jest.fn(() => instance);

  return {
    consoleTransport: jest.fn(),
    logger: { createLogger },
    __mock__: { instance, createLogger },
  };
});

describe('logger.ts', () => {
  let rnLogs: any;

  beforeEach(() => {
    (globalThis as any).__DEV__ = false;

    jest.resetModules();
    jest.clearAllMocks();

    // IMPORTANT: re-require the mock AFTER resetModules so we get a fresh reference
    rnLogs = require('react-native-logs');

    rnLogs.__mock__.instance.debug.mockClear();
    rnLogs.__mock__.instance.info.mockClear();
    rnLogs.__mock__.instance.warn.mockClear();
    rnLogs.__mock__.instance.error.mockClear();
    rnLogs.__mock__.createLogger.mockClear();
    delete process.env.EXPO_PUBLIC_LOG_LEVEL;
  });

  test('uses severity from EXPO_PUBLIC_LOG_LEVEL', () => {
    process.env.EXPO_PUBLIC_LOG_LEVEL = 'warn';

    // Import after env var set so module init picks it up
    jest.isolateModules(() => {
      require('@/utils/logger'); 
    });

    expect(rnLogs.__mock__.createLogger).toHaveBeenCalledTimes(1);
    const arg = rnLogs.__mock__.createLogger.mock.calls[0][0];
    expect(arg).toMatchObject({ severity: 'warn' });
  });

  test('exports a singleton and forwards to underlying logger', () => {
    jest.isolateModules(() => {
      const { log } = require('@/utils/logger');
      log.info('hello', { a: 1 });
      log.warn('careful');
      log.error('boom');
      log.debug('details');
    });

    expect(rnLogs.__mock__.instance.info).toHaveBeenCalledWith('hello', { a: 1 });
    expect(rnLogs.__mock__.instance.warn).toHaveBeenCalledWith('careful');
    expect(rnLogs.__mock__.instance.error).toHaveBeenCalledWith('boom');
    expect(rnLogs.__mock__.instance.debug).toHaveBeenCalledWith('details');
  });

});
