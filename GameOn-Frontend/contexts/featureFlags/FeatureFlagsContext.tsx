import React, { createContext, useContext, useEffect, useState } from "react";
import { defaultFlags } from "./flagsConfig";

type Flags = typeof defaultFlags;

interface FeatureFlagsContextType {
  flags: Flags;
  toggleFlag: (name: keyof Flags) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Flags>(defaultFlags);

  // Load from localStorage (or AsyncStorage if React Native)
  useEffect(() => {
    const stored = localStorage.getItem("featureFlags");
    if (stored) setFlags(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("featureFlags", JSON.stringify(flags));
  }, [flags]);

  const toggleFlag = (name: keyof Flags) => {
    setFlags((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, toggleFlag }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (!context) throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider");
  return context;
};
