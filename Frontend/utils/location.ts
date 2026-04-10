import * as Location from "expo-location";
import { router } from "expo-router";
import { Alert, Linking } from "react-native";
import { toast } from "@/utils/toast";

let locationDeniedAlertShownThisSession = false;

function presentLocationDeniedAlert() {
  Alert.alert(
    "Location Access Needed",
    "GameOn uses location access to show nearby matches in Explore. Grant access in Settings, or update your Explore Preferences.",
    [
      {
        text: "Update Explore Preferences",
        onPress: () => {
          router.push("/settings");
        },
      },
      {
        text: "Open Settings",
        onPress: () => {
          void Linking.openSettings();
        },
      },
      { text: "Cancel", style: "destructive" },
    ],
  );
}

function presentLocationDeniedToast() {
  toast.warning("Location Access Needed", {
    description:
      "Grant access in Settings, or update your Explore Preferences.",
  });
}

function presentLocationDenied() {
  if (!locationDeniedAlertShownThisSession) {
    locationDeniedAlertShownThisSession = true;
    presentLocationDeniedAlert();
    return;
  }
  presentLocationDeniedToast();
}

function presentLocationReadFailedToast() {
  toast.error("Location Error", {
    description: "We couldn't read your location. Try again in a moment.",
  });
}

export async function requestLocationPermission(): Promise<boolean> {
  let { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") {
    const request = await Location.requestForegroundPermissionsAsync();
    status = request.status;
  }

  if (status !== "granted") {
    presentLocationDeniedToast();
    return false;
  }

  return true;
}

export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status === "denied") {
      presentLocationDenied();
      return null;
    }

    if (status !== "granted") {
      const granted = await requestLocationPermission();
      if (!granted) return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;
    return { latitude, longitude };
  } catch {
    presentLocationReadFailedToast();
    return null;
  }
}
