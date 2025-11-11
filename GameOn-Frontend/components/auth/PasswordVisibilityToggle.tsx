import { Pressable } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export const PasswordVisbilityToggle: React.FC<{
  showpassword: boolean;
  setShowpassword: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ showpassword, setShowpassword }) => {
  return (
    <Pressable onPress={() => setShowpassword(!showpassword)} hitSlop={8}>
      {showpassword ? (
        <IconSymbol name={"eye.slash.fill"} color={"#bab8b8ff"} />
      ) : (
        <IconSymbol name={"eye.fill"} color={"#bab8b8ff"} />
      )}
    </Pressable>
  );
};
