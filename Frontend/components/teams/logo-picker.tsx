import React, { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { createTeamStyles as styles } from "@/components/teams/teams-styles";

type Props = {
  value?: string | null;
  onChange?: (uri: string | null) => void;
};

export function TeamLogoSection({ value, onChange }: Readonly<Props>) {
  const [localLogo, setLocalLogo] = useState<string | null>(value ?? null);

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "We need access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setLocalLogo(uri);
      onChange?.(uri);
    }
  };

  const logoUri = localLogo ?? value;

  return (
    <View style={styles.logoSection}>
      <Pressable style={styles.logoCircle} onPress={handlePickLogo}>
        {logoUri ? (
          <Image
            source={{ uri: logoUri }}
            style={styles.logoImage}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.logoIcon}>📷</Text>
        )}
      </Pressable>

      <Pressable onPress={handlePickLogo}>
        <Text style={styles.uploadText}>
          {logoUri ? "Change Logo" : "Upload Logo"}
        </Text>
      </Pressable>
    </View>
  );
}
