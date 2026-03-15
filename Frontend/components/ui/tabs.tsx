import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { GlassView } from "expo-glass-effect";
import { useHeaderHeight } from "@/hooks/use-header-height";

interface TabsProps {
  readonly values: string[];
  readonly selectedIndex: number;
  readonly onValueChange: (value: string) => void;
}

export function Tabs({
  values,
  selectedIndex,
  onValueChange,
}: Readonly<TabsProps>) {
  const headerHeight = useHeaderHeight();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={[styles.scroll, { top: headerHeight + 4 }]}
    >
      {values.map((value, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Pressable
            key={`${value}-${index}`}
            onPress={() => onValueChange(value)}
            style={styles.pressable}
          >
            <GlassView
              isInteractive
              tintColor={isSelected ? "white" : undefined}
              style={styles.glass}
            >
              <Text style={[styles.text, isSelected && styles.textSelected]}>
                {value}
              </Text>
            </GlassView>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "visible",
  },
  content: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
  },
  pressable: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  glass: {
    flex: 1,
    paddingHorizontal: 20,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  textSelected: {
    color: "black",
  },
});
