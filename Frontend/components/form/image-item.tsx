import { StyleSheet, Pressable, PressableProps } from "react-native";
import { Image, ImageSource } from "expo-image";
import { GlassView } from "expo-glass-effect";

interface ImageItemProps extends PressableProps {
  readonly image: ImageSource;
}

export function ImageItem({
  image,
  ...pressableProps
}: Readonly<ImageItemProps>) {
  return (
    <Pressable {...pressableProps}>
      <GlassView isInteractive={true} style={styles.image}>
        <Image source={image} style={styles.image} />
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 160,
    height: 160,
    borderRadius: 100,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});
