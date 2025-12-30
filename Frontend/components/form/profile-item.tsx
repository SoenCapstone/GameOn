import {
  StyleSheet,
  Pressable,
  PressableProps,
  View,
  Text,
} from "react-native";
import { Image, ImageSource } from "expo-image";
import { BlurView } from "expo-blur";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface ProfileItemProps extends PressableProps {
  readonly name: string;
  readonly email?: string;
  readonly image: ImageSource;
}

export function ProfileItem({
  name,
  email,
  image,
  ...pressableProps
}: Readonly<ProfileItemProps>) {
  return (
    <Pressable {...pressableProps}>
      {({ pressed }) => (
        <BlurView
          tint={pressed ? "default" : "systemUltraThinMaterialDark"}
          style={styles.item}
        >
          <View style={styles.container}>
            <Image source={image} style={styles.image} />
            <View>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.email}>{email}</Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" color="#8C8C8C" size={16} />
        </BlurView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    width: "100%",
    height: 88,
    borderRadius: 30,
    overflow: "hidden",
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    alignSelf: "center",
  },
  name: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: 600,
    color: "white",
  },
  email: {
    fontSize: 15,
    lineHeight: 20,
    color: "rgba(235,235,245,0.6)",
  },
  image: {
    borderRadius: "100%",
    height: 60,
    width: 60,
  },
});
