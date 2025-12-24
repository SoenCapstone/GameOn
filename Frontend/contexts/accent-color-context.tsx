import { createContext, ReactNode, useContext } from "react";
import { AccentColors } from "@/constants/colors";

const AccentColorContext = createContext<string>(AccentColors.blue);

export function AccentColorProvider({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) {
  return (
    <AccentColorContext.Provider value={color}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  return useContext(AccentColorContext);
}
