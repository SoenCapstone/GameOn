export const Colors = {
  blue: "#0C456E",
  purple: "#58175D",
  green: "#005D29",
  orange: "#CE721D",
  red: "#8E0000",
} as const;

export const AccentColors = {
  blue: "#5CB8FF",
  purple: "#EA8DFF",
  green: "#4AE968",
  orange: "#FFA056",
} as const;

export type Color = keyof typeof Colors;
