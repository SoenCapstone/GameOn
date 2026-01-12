import { Pressable, StyleSheet, View, Text } from "react-native";
import { CLEAR_SHAPES_BUTTON_CONFIG, ClearShapesButtonProps } from "./model";
import { IconContainer } from "./play-maker-icon/icon-container";

export const ClearShapesButton = ({
  setShapes,
  shapes,
  selectedShapeId,
}: ClearShapesButtonProps) => {
  return (
    <View style={styles.container}>
      {CLEAR_SHAPES_BUTTON_CONFIG.map((button) => (
        <View key={button.tool}>
          <Pressable
            testID={`clear-shapes-${button.tool}`}
            onPress={() => button.onPress(shapes, setShapes, selectedShapeId)}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="button"
          >
            <IconContainer size={button.size} xml={button.xml} />
          </Pressable>
          <Text numberOfLines={1} style={styles.label}>
            {button.tool}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  label: {
    alignSelf: "center",
    paddingTop: 2,
    fontSize: 10,
    lineHeight: 12,
    opacity: 0.85,
    color: "white",
    letterSpacing: 0.2,
  },
  button: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: "white",
    opacity: 0.85,
    fontSize: 13,
    fontWeight: "600",
  },
});
