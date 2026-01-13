import { View, Text, Pressable, StyleSheet } from "react-native";
import { SELECT_SHAPE_BUTTON_CONFIG, ShapesTabProps } from "./model";
import { IconContainer } from "./play-maker-icon/icon-container";

export const ShapesTab = ({ selectedTool, onSelectTool }: ShapesTabProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {SELECT_SHAPE_BUTTON_CONFIG?.map(({ tool, size, xml }) => {
          const active = selectedTool === tool;

          return (
            <View key={tool}>
              <Pressable
                testID={`shape-tool-${tool}`}
                onPress={() => onSelectTool(tool)}
                style={({ pressed }) => [
                  styles.button,
                  active && styles.buttonActive,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <IconContainer size={size} xml={xml} />
              </Pressable>
              <Text
                numberOfLines={1}
                style={[styles.label, active && styles.labelSelected]}
              >
                {tool}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 6,
    alignItems: "center",
    paddingBottom: 6,
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
  labelSelected: {
    opacity: 1,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  buttonActive: {
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.18)",
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
  buttonTextActive: {
    opacity: 1,
  },
});
