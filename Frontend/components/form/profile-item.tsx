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
  readonly title: string;
  readonly subtitle?: string;
  readonly image: ImageSource;
  readonly logo?: boolean;
}

export function ProfileItem({
  title,
  subtitle,
  image,
  logo,
  ...pressableProps
}: Readonly<ProfileItemProps>) {
  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      <Pressable {...pressableProps} style={styles.pressable}>
        {({ pressed }) => (
          <>
            <View style={[styles.container, pressed && styles.pressed]}>
              {logo ? (
                <Image
                  source={image}
                  style={[styles.image, styles.imageLogo]}
                />
              ) : (
                <BlurView tint="systemUltraThinMaterial" style={styles.blur}>
                  <Image source={image} style={styles.image} />
                </BlurView>
              )}
              <View style={styles.labels}>
                <Text style={styles.title}>{title}</Text>
                {subtitle != null && (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                )}
              </View>
            </View>
            <IconSymbol
              name="chevron.right"
              color="#8C8C8C"
              size={16}
              style={pressed && styles.pressed}
            />
          </>
        )}
      </Pressable>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  item: {
    width: "100%",
    height: 88,
    borderRadius: 30,
    overflow: "hidden",
    paddingHorizontal: 20,
  },
  pressable: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  blur: {
    borderRadius: 100,
    overflow: "hidden",
  },
  labels: {
    gap: 2,
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: 600,
    color: "white",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    color: "rgba(235,235,245,0.6)",
  },
  image: {
    height: 60,
    width: 60,
  },
  imageLogo: {
    height: 46,
    width: 46,
  },
  pressed: {
    opacity: 0.7,
  },
});
