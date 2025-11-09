import { GlassView } from "expo-glass-effect";
import { Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export function AddButton() {
  const router = useRouter();

  const handlePress = () => {
    router.push("/(contexts)/teams/createTeam");
  };
  
  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <GlassView style={{ width: 44, height: 44, borderRadius: 33, alignItems: "center", justifyContent: "center",}}>
        <Text
          style={{
            color: "#fff",
            fontSize: 28,
            fontWeight: "600",
            lineHeight: 28,
          }}
        >
          +
        </Text>
      </GlassView>
    </Pressable>
  );
}
