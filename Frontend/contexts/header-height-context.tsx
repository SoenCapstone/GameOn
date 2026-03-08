import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { HeaderHeightContext as RNHeaderHeightContext } from "@react-navigation/elements";

type HeaderHeightContextValue = {
  height: number;
  setHeight: (value: number) => void;
};

const HeaderHeightContext = createContext<HeaderHeightContextValue | null>(
  null,
);

export function HeaderHeightProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [cached, setCached] = useState(0);
  const setHeight = useCallback((value: number) => {
    setCached((prev) => Math.max(value, prev));
  }, []);

  const value = useMemo(
    () => ({ height: cached, setHeight }),
    [cached, setHeight],
  );

  return (
    <HeaderHeightContext.Provider value={value}>
      {children}
    </HeaderHeightContext.Provider>
  );
}

export function useHeaderHeight() {
  const context = useContext(HeaderHeightContext);
  const measured = useContext(RNHeaderHeightContext) ?? 0;

  useEffect(() => {
    if (context) context.setHeight(measured);
  }, [context, measured]);

  return context?.height && context?.height > 0 ? context?.height : measured;
}
