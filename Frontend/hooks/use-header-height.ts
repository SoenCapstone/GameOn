import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useHeaderHeight as useNavigationHeaderHeight } from "@react-navigation/elements";
import { createScopedLog } from "@/utils/logger";

const headerHeightStorageKey = "headerHeight";
const log = createScopedLog("useHeaderHeight");

export function useHeaderHeight() {
  const [height, setHeight] = useState<number | null>(null);
  const measured = ((h) => (Number.isInteger(h) && h > 0 ? h : null))(
    useNavigationHeaderHeight(),
  );

  useEffect(() => {
    AsyncStorage.getItem(headerHeightStorageKey)
      .then((storedHeight) => {
        if (storedHeight == null) {
          return;
        }

        setHeight((current) => current ?? Number(storedHeight));
      })
      .catch((error) => {
        log.warn("Failed to load cached header height", error);
      });
  }, []);

  useEffect(() => {
    if (measured == null) {
      return;
    }

    setHeight((current) => {
      if (current === measured) {
        return current;
      }

      AsyncStorage.setItem(headerHeightStorageKey, String(measured)).catch(
        (error) => {
          log.warn("Failed to save header height", error);
        },
      );
      return measured;
    });
  }, [measured]);

  return measured ?? height ?? 0;
}
