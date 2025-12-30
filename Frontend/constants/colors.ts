export const Colors = {
  blue: "#0C456E",
  purple: "#58175D",
  green: "#005D29",
  orange: "#CE680A",
  red: "#8E0000",
  salmon: "#FA8072"
} as const;

export const AccentColors = {
  blue: "#2494E4",
  purple: "#e046ec",
  green: "#34C759",
  orange: "#FF8D28",
  red: "#FF383C",
} as const;

export type Color = keyof typeof Colors;
