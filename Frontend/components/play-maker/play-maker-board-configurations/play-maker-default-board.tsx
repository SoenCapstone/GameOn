import Svg, { Rect } from "react-native-svg";
export const DefaultBoard = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Svg width="100%" height="100%">
      <Rect x={0} y={0} width="100%" height="100%" fill="rgba(0,0,0,0.15)" />
      {children}
    </Svg>
  );
};
