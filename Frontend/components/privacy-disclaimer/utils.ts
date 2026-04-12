import * as WebBrowser from "expo-web-browser";
import { toast } from "@/utils/toast";
import { POLICY_URL } from "@/components/privacy-disclaimer/constants";

export const openPolicy = async () => {
  try {
    await WebBrowser.openBrowserAsync(POLICY_URL, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  } catch (error) {
    toast.error("Error Opening Link", {
      description: (error as Error).message,
    });
  }
};
