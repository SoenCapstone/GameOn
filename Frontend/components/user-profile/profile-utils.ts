import { Alert } from "react-native";
import { createScopedLog, LoggerProps } from "@/utils/logger";
import { File } from "expo-file-system";
import { errorToString } from "@/utils/error";
import { UserResource } from "@clerk/types";
import { AxiosInstance } from "axios";
import { GO_USER_SERVICE_ROUTES } from "@/hooks/use-axios-clerk";

const log = createScopedLog("Profile");
interface HandleSaveParams {
  api: AxiosInstance;
  user: UserResource | null;
  firstName: string;
  lastName: string;
  email: string;
  image: { uri: string; mimeType?: string } | number | null;
  router: { back: () => void };
}

export const handleSaveProfile = async ({
  api,
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
      let imageUrl: string | null = user.imageUrl ?? null;

      await user.update({
        firstName,
        lastName,
      });

      if (image === null && user.hasImage) {
        await user.setProfileImage({ file: null });
        imageUrl = null;
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
        await user.reload();
        imageUrl = user.imageUrl ?? null;
        log.info("Profile image updated successfully");
      } else if (user.hasImage) {
        imageUrl = user.imageUrl ?? null;
      }

      await api.put(GO_USER_SERVICE_ROUTES.UPDATE, {
        id: user.id,
        firstname: firstName,
        lastname: lastName,
        email,
        imageUrl,
      });
    }

    Alert.alert("Success", "Profile updated");
  } catch (err) {
    log.error("Fetch error:", errorToString(err));
    Alert.alert("Error", "Failed to update profile: " + errorToString(err));
  }

  log.info("Updated Profile:", { firstName, lastName, email, image });

  router.back();
};

export const confirmLogout = (signOut: () => void, log: LoggerProps) => {
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
