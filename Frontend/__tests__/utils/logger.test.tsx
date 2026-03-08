import { log, createScopedLog } from "@/utils/logger";

describe("logger module behavior", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_LOG_LEVEL;
    delete (globalThis as Record<string, unknown>).__DEV__;
    jest.restoreAllMocks();
  });

  it("createScopedLog forwards calls and handles optional data correctly", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const debugSpy = jest.spyOn(log, "debug").mockImplementation(() => {});
    const infoSpy = jest.spyOn(log, "info").mockImplementation(() => {});
    const warnSpy = jest.spyOn(log, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(log, "error").mockImplementation(() => {});

    const scoped = createScopedLog("MyScope");

    scoped.debug("msg1", { a: 1 });
    scoped.debug("msg2");

    scoped.info("inf1");
    scoped.info("inf2", { b: 2 });

    scoped.warn("warn1", "payload");
    scoped.error("err1", null);

    expect(debugSpy).toHaveBeenNthCalledWith(1, "MyScope: msg1", { a: 1 });
    expect(debugSpy).toHaveBeenNthCalledWith(2, "MyScope: msg2", undefined);

    expect(infoSpy).toHaveBeenNthCalledWith(1, "MyScope: inf1");
    expect(infoSpy).toHaveBeenNthCalledWith(2, "MyScope: inf2", { b: 2 });

    expect(warnSpy).toHaveBeenCalledWith("MyScope: warn1", "payload");
    expect(errorSpy).toHaveBeenCalledWith("MyScope: err1", null);

    consoleSpy.mockRestore();
  });
});
