import React from "react";
import * as Haptics from "expo-haptics";
import { toast as sonnerToast } from "sonner-native";
import { toast } from "@/utils/toast";

describe("toast util", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("triggers selection haptics and forwards the base toast call", () => {
    const mockedSonnerToast = jest.mocked(sonnerToast);
    mockedSonnerToast.mockReturnValueOnce("toast-id");

    const result = toast("Saved", {
      description: "Changes synced.",
    });

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(sonnerToast).toHaveBeenCalledWith("Saved", {
      description: "Changes synced.",
    });
    expect(result).toBe("toast-id");
  });

  it.each([
    ["info", toast.info, sonnerToast.info],
    ["loading", toast.loading, sonnerToast.loading],
  ])(
    "uses selection haptics for %s toasts",
    (_label, wrapper, sonnerMethod) => {
      const mockedSonnerMethod = jest.mocked(sonnerMethod);
      mockedSonnerMethod.mockReturnValueOnce("toast-id");

      const result = wrapper("Heads up", {
        description: "Something is happening.",
      });

      expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
      expect(sonnerMethod).toHaveBeenCalledWith("Heads up", {
        description: "Something is happening.",
      });
      expect(result).toBe("toast-id");
    },
  );

  it("uses selection haptics for custom toasts", () => {
    const customNode = React.createElement(React.Fragment);
    const mockedCustomToast = jest.mocked(sonnerToast.custom);
    mockedCustomToast.mockReturnValueOnce("toast-id");

    const result = toast.custom(customNode, {
      description: "Custom content",
    });

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(sonnerToast.custom).toHaveBeenCalledWith(customNode, {
      description: "Custom content",
    });
    expect(result).toBe("toast-id");
  });

  it.each([
    [
      "success",
      toast.success,
      sonnerToast.success,
      Haptics.NotificationFeedbackType.Success,
    ],
    [
      "warning",
      toast.warning,
      sonnerToast.warning,
      Haptics.NotificationFeedbackType.Warning,
    ],
    [
      "error",
      toast.error,
      sonnerToast.error,
      Haptics.NotificationFeedbackType.Error,
    ],
  ])(
    "uses notification haptics for %s toasts",
    (_label, wrapper, sonnerMethod, hapticType) => {
      const mockedSonnerMethod = jest.mocked(sonnerMethod);
      mockedSonnerMethod.mockReturnValueOnce("toast-id");

      const result = wrapper("Problem", {
        description: "Something changed.",
      });

      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(hapticType);
      expect(sonnerMethod).toHaveBeenCalledWith("Problem", {
        description: "Something changed.",
      });
      expect(result).toBe("toast-id");
    },
  );

  it("uses selection haptics immediately and success notification haptics when promise resolves", async () => {
    const promise = Promise.resolve("done");
    const options = {
      loading: "Saving",
      success: (result: string) => result,
      error: "Failed",
    };

    const mockedPromiseToast = jest.mocked(sonnerToast.promise);
    mockedPromiseToast.mockReturnValueOnce("promise-id");

    const result = toast.promise(promise, options);
    const wrappedPromise = mockedPromiseToast.mock.calls[0][0];

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(sonnerToast.promise).toHaveBeenCalledWith(wrappedPromise, options);
    await expect(wrappedPromise).resolves.toBe("done");
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
    expect(result).toBe("promise-id");
  });

  it("uses error notification haptics when promise rejects", async () => {
    const error = new Error("boom");
    const promise = Promise.reject(error);
    const options = {
      loading: "Saving",
      success: (result: string) => result,
      error: "Failed",
    };

    const mockedPromiseToast = jest.mocked(sonnerToast.promise);
    mockedPromiseToast.mockReturnValueOnce("promise-id");

    const result = toast.promise(promise, options);
    const wrappedPromise = mockedPromiseToast.mock.calls[0][0];

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    await expect(wrappedPromise).rejects.toThrow("boom");
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Error,
    );
    expect(result).toBe("promise-id");
  });

  it("forwards dismiss and wiggle without haptics", () => {
    const mockedDismissToast = jest.mocked(sonnerToast.dismiss);
    mockedDismissToast.mockReturnValueOnce("dismissed");

    const dismissResult = toast.dismiss("toast-id");
    toast.wiggle("toast-id");

    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(sonnerToast.dismiss).toHaveBeenCalledWith("toast-id");
    expect(sonnerToast.wiggle).toHaveBeenCalledWith("toast-id");
    expect(dismissResult).toBe("dismissed");
  });
});
