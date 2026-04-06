import * as Haptics from "expo-haptics";
import { toast as sonnerToast } from "sonner-native";

type Toast = typeof sonnerToast;

const selectionHaptic = () => {
  void Haptics.selectionAsync().catch(() => undefined);
};

const notificationHaptic = (type: Haptics.NotificationFeedbackType) => {
  void Haptics.notificationAsync(type).catch(() => undefined);
};

const toast = ((message: string, data?: Parameters<Toast>[1]) => {
  selectionHaptic();
  return sonnerToast(message, data);
}) as Toast;

toast.success = (message, data) => {
  notificationHaptic(Haptics.NotificationFeedbackType.Success);
  return sonnerToast.success(message, data);
};

toast.info = (message, data) => {
  selectionHaptic();
  return sonnerToast.info(message, data);
};

toast.error = (message, data) => {
  notificationHaptic(Haptics.NotificationFeedbackType.Error);
  return sonnerToast.error(message, data);
};

toast.warning = (message, data) => {
  notificationHaptic(Haptics.NotificationFeedbackType.Warning);
  return sonnerToast.warning(message, data);
};

toast.custom = (jsx, data) => {
  selectionHaptic();
  return sonnerToast.custom(jsx, data);
};

toast.promise = (promise, options) => {
  selectionHaptic();

  const wrappedPromise = promise
    .then((result) => {
      notificationHaptic(Haptics.NotificationFeedbackType.Success);
      return result;
    })
    .catch((error) => {
      notificationHaptic(Haptics.NotificationFeedbackType.Error);
      throw error;
    });

  return sonnerToast.promise(wrappedPromise, options);
};

toast.loading = (message, data) => {
  selectionHaptic();
  return sonnerToast.loading(message, data);
};

toast.dismiss = (id) => sonnerToast.dismiss(id);

toast.wiggle = (id) => sonnerToast.wiggle(id);

export { toast };
