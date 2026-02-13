import { StyleSheet, View } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface ProgressiveBlurProps {
  readonly height?: number;
}

export function ProgressiveBlur({ height = 100 }: ProgressiveBlurProps) {
  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <MaskedView
        maskElement={
          <LinearGradient
            locations={[0, 0.5, 1]}
            colors={["transparent", "rgba(0,0,0,0.8)", "black"]}
            style={StyleSheet.absoluteFill}
          />
        }
        style={StyleSheet.absoluteFill}
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
});
