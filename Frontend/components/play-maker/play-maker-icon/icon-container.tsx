import { SvgXml } from "react-native-svg";
import { IconProps } from "./model";

export const IconContainer = ({ size = 32, xml }: IconProps) => {
  return <SvgXml xml={xml} width={size} height={size} />;
};
