import { SvgXml } from "react-native-svg";
import { IconProps } from "@/components/play-maker/play-maker-icon/model";

export const IconContainer = ({ size = 32, xml }: IconProps) => {
  return <SvgXml xml={xml} width={size} height={size} />;
};
