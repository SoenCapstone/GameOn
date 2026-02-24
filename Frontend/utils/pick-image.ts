import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

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
      let uri = asset.uri;
      let mimeType = asset.mimeType ?? "image/jpeg";

      if (asset.width !== asset.height) {
        const side = Math.min(asset.width, asset.height);
        const originX = Math.floor((asset.width - side) / 2);
        const originY = Math.floor((asset.height - side) / 2);

        const mimeSubtype = (
          asset.mimeType?.split("/")[1] ?? "jpeg"
        ).toUpperCase() as keyof typeof ImageManipulator.SaveFormat;
        const format =
          ImageManipulator.SaveFormat[mimeSubtype] ??
          ImageManipulator.SaveFormat.JPEG;

        const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
        context.crop({ originX, originY, width: side, height: side });
        const image = await context.renderAsync();
        const cropped = await image.saveAsync({ format, compress: 1 });
        context.release();
        image.release();

        uri = cropped.uri;
      }

      setImage({ uri, mimeType });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Image picker error:", message);
    Alert.alert("Error", "Failed to pick image: " + message);
  }
};
