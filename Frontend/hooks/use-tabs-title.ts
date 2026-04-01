import { useSyncExternalStore } from "react";
import { getTabsTitle, subscribeTabsTitle } from "@/utils/tabs-title";

export function useTabsTitle() {
  return useSyncExternalStore(subscribeTabsTitle, getTabsTitle, getTabsTitle);
}
