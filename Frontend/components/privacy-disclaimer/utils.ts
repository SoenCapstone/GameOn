import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { POLICY_URL } from "@/components/privacy-disclaimer/constants";

export const openPolicy = async () => {
  try {
    await WebBrowser.openBrowserAsync(POLICY_URL, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  } catch (error) {
    Alert.alert("Error opening link", (error as Error).message);
  }
};
