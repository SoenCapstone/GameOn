import { Alert } from "react-native";
import { createScopedLog } from "@/utils/logger";
import * as ImagePicker from "expo-image-picker";

const log = createScopedLog("Profile");


interface HandleSaveParams {
  user: any;
  firstName: string;
  lastName: string;
  email: string;
  profilePic: string;
  router: { back: () => void };
}

export const handleSaveProfile = async ({
  user,
  firstName,
  lastName,
  email,
  profilePic,
  router,
}: HandleSaveParams) => {

    if (!firstName?.trim()) {
      Alert.alert("First Name must not be empty", "Please enter a valid First Name");
      return;
    }

    if (!lastName?.trim()) {
      Alert.alert("Last Name must not be empty", "Please enter a valid Last Name");
      return;
    }

    try {
      if (user) {
        await user.update({
          firstName,
          lastName,
        });
      }

      Alert.alert("Success", "Profile updated");

    } catch (err: any) {
      console.error("Fetch error:", err.message);
      Alert.alert("Error", "Failed to update profile: " + err.message);
    }

    log.info("Updated Profile:", { firstName, lastName, email, profilePic });

    router.back();
};


export const pickImage = async (setProfilePic: (uri: { uri: string }) => void) => {
  try {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission denied", "You need to allow access to your media library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfilePic({ uri: result.assets[0].uri });
    }
  } catch (err: any) {
    console.error("Image picker error:", err.message);
    Alert.alert("Error", "Failed to pick image: " + err.message);
  }
};



export const confirmLogout = (signOut: () => void, log: any) => {
  return () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            log.info("User confirmed logout");
            signOut();
          },
        },
      ],
      { cancelable: true }
    );
  };
};