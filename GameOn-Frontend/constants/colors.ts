export const Colors = {
  red: "#8E0000",
  orange: "#CE721D",
  purple: "#58175D",
  blue: "#0C456E",
  green: "#005D29",
} as const;

export type ColorName = keyof typeof Colors;
