import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const PasswordVisbilityToggle: React.FC<{
  showpassword: boolean;
  setShowpassword: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ showpassword, setShowpassword }) => {
  return (
    <Pressable onPress={() => setShowpassword(!showpassword)} hitSlop={8}>
      <Ionicons
        name={showpassword ? "eye-off-outline" : "eye-outline"}
        size={20}
        color="#bab8b8ff"
      />
    </Pressable>
  );
};
