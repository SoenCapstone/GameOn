import { StyleSheet, Pressable, PressableProps } from "react-native";
import { Image, ImageSource } from "expo-image";
import { GlassView } from "expo-glass-effect";

interface ImageItemProps extends PressableProps {
  readonly image: ImageSource;
  readonly logo?: boolean;
}

export function ImageItem({
  image,
  logo = false,
  ...pressableProps
}: Readonly<ImageItemProps>) {
  return (
    <GlassView isInteractive={true} style={styles.glass}>
      <Pressable style={styles.pressable} {...pressableProps}>
        <Image source={image} style={logo ? styles.image : styles.glass} />
      </Pressable>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  glass: {
    width: 160,
    height: 160,
    borderRadius: 100,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  pressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 110,
    height: 110,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});
