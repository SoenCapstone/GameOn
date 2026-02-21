import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export const pickImage = async (
  setImage: (img: { uri: string; mimeType?: string }) => void,
) => {
  try {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(
        "Permission denied",
        "You need to allow access to your media library.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      exif: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        mimeType: asset.mimeType || "image/jpeg",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Image picker error:", message);
    Alert.alert("Error", "Failed to pick image: " + message);
  }
};
