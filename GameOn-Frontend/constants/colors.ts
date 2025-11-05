export const Colors = {
  blue: "#0C456E",
  purple: "#58175D",
  green: "#005D29",
  orange: "#CE680A",
  red: "#8E0000",
  salmon: '#F3A6A6CC'
} as const;

export const AccentColors = {
  blue: "#5CB8FF",
  purple: "#EA8DFF",
  green: "#4AE968",
  orange: "#FFA056",
  red: "#FF6165",
} as const;

export type Color = keyof typeof Colors;
