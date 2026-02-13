import { Text, StyleSheet, Pressable, View } from "react-native";
import { BlurView } from "expo-blur";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAccentColor } from "@/contexts/accent-color-context";

interface MultiselectRowProps {
  readonly label: string;
  readonly isSelected: boolean;
  readonly onPress: () => void;
  readonly selectedColor: string;
}

function MultiselectRow({
  label,
  isSelected,
  onPress,
  selectedColor,
}: MultiselectRowProps) {
  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      <Pressable onPress={onPress} style={styles.pressable}>
        {({ pressed }) => (
          <>
            <Text style={styles.label}>{label}</Text>
            <IconSymbol
              name={isSelected ? "checkmark.circle.fill" : "circle"}
              color={isSelected ? selectedColor : "#8C8C8C"}
              size={24}
              style={pressed ? styles.pressed : undefined}
            />
          </>
        )}
      </Pressable>
    </BlurView>
  );
}

interface MultiselectItemProps {
  readonly options: readonly string[];
  readonly selected: readonly string[];
  readonly onSelected: (selected: string[]) => void;
  readonly color?: string;
}

export function MultiselectItem({
  options,
  selected,
  onSelected,
  color,
}: Readonly<MultiselectItemProps>) {
  const accentColor = useAccentColor();
  const selectedColor = color ?? accentColor;
  const selectedSet = new Set(selected);

  const handlePress = (option: string) => {
    if (selectedSet.has(option)) {
      onSelected(selected.filter((s) => s !== option));
    } else {
      onSelected([...selected, option]);
    }
  };

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <MultiselectRow
          key={option}
          label={option}
          isSelected={selectedSet.has(option)}
          onPress={() => handlePress(option)}
          selectedColor={selectedColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 16,
  },
  item: {
    width: "100%",
    height: 52,
    borderRadius: 30,
    overflow: "hidden",
    paddingLeft: 20,
    paddingRight: 16,
  },
  pressable: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "white",
    fontSize: 17,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.7,
  },
});
