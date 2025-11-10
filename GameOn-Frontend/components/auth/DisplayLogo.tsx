import { authStyles } from "@/constants/auth-styles";
import { images } from "@/constants/images";
import { View, Image } from "react-native";

export const DisplayLogo: React.FC<{
  top: number;
  styleRenderWidth: number;
  styleRenderHeight: number;
}> = ({ top, styleRenderWidth, styleRenderHeight }) => {
  return (
    <View style={[authStyles.hero, { top: top }]}>
      <Image
        source={images.logo}
        style={{ width: styleRenderWidth, height: styleRenderHeight }}
        resizeMode="contain"
      />
    </View>
  );
};
