import { Pressable } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export const PasswordVisibilityToggle: React.FC<{
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ showPassword, setShowPassword }) => {
  return (
    <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
      {showPassword ? (
        <IconSymbol name={"eye.slash.fill"} color={"rgba(186,184,184,0.5)"} />
      ) : (
        <IconSymbol name={"eye.fill"} color={"rgba(186,184,184,0.5)"} />
      )}
    </Pressable>
  );
};
