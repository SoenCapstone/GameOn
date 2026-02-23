import { Alert } from "react-native";
import { createScopedLog } from "@/utils/logger";
import { File } from "expo-file-system";

const log = createScopedLog("Profile");

interface HandleSaveParams {
  user: any;
  firstName: string;
  lastName: string;
  email: string;
  image: { uri: string; mimeType?: string } | number | null;
  router: { back: () => void };
}

export const handleSaveProfile = async ({
  user,
  firstName,
  lastName,
  email,
  image,
  router,
}: HandleSaveParams) => {
  if (!firstName?.trim()) {
    Alert.alert(
      "First Name must not be empty",
      "Please enter a valid First Name",
    );
    return;
  }

  if (!lastName?.trim()) {
    Alert.alert(
      "Last Name must not be empty",
      "Please enter a valid Last Name",
    );
    return;
  }

  try {
    if (user) {
      await user.update({
        firstName,
        lastName,
      });

      if (image === null && user.hasImage) {
        await user.setProfileImage({ file: null });
        log.info("Profile image deleted successfully");
      } else if (
        image !== null &&
        typeof image === "object" &&
        image.uri &&
        !image.uri.startsWith("https://")
      ) {
        const mimeType = image.mimeType || "image/jpeg";
        const file = new File(image.uri);
        const base64 = await file.base64();
        await user.setProfileImage({
          file: `data:${mimeType};base64,${base64}`,
        });
        log.info("Profile image updated successfully");
      }
    }

    Alert.alert("Success", "Profile updated");
  } catch (err: any) {
    console.error("Fetch error:", err.message);
    Alert.alert("Error", "Failed to update profile: " + err.message);
  }

  log.info("Updated Profile:", { firstName, lastName, email, image });

  router.back();
};

export const confirmLogout = (signOut: () => void, log: any) => {
  return () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            log.info("User confirmed sign out");
            signOut();
          },
        },
      ],
      { cancelable: true },
    );
  };
};
