import { LinearGradient } from "expo-linear-gradient";
import { authStyles } from "@/constants/auth-styles";

export const AuthLinearGradient: React.FC<{ top: number }> = ({ top }) => {
  return (
    <LinearGradient
      colors={["#1473B7", "rgba(0,0,0,0)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[authStyles.topGradient, { height: top }]}
      pointerEvents="none"
    />
  );
};
