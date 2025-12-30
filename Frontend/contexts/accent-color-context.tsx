import { createContext, ReactNode, useContext } from "react";
import { AccentColors } from "@/constants/colors";

const AccentColorContext = createContext<string>(AccentColors.blue);

interface AccentColorProviderProps {
  readonly children: ReactNode;
  readonly color: string;
}

export function AccentColorProvider({
  children,
  color,
}: AccentColorProviderProps) {
  return (
    <AccentColorContext.Provider value={color}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  return useContext(AccentColorContext);
}
