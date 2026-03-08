import type { ImageSourcePropType } from "react-native";

export const BACKGROUND_OPTIONS :  Record<string, ImageSourcePropType> ={
  soccer: require("@/assets/images/play-maker/soccer_stadium.png"),
  basketball: require("@/assets/images/play-maker/basketball_stadium.png"),
  hockey: require("@/assets/images/play-maker/hockey_stadium.png"),
  volleyball: require("@/assets/images/play-maker/volleyball_stadium.png"),
  default: require("@/assets/images/play-maker/generic_stadium.png"),
} ;