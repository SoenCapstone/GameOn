import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

type Flags = {
  newUI: boolean;
  betaMode: boolean;
};

type FeatureFlagsContextType = {
  flags: Flags;
  toggleFlag: (key: keyof Flags) => void;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Flags>({
    newUI: false,
    betaMode: false,
  });

  // ✅ Load flags from storage when the app starts
  useEffect(() => {
    (async () => {
      try {
        const json = Platform.OS === "web"
          ? localStorage.getItem("featureFlags")
          : await AsyncStorage.getItem("featureFlags");

        if (json) setFlags(JSON.parse(json));
      } catch (error) {
        console.warn("Error loading feature flags:", error);
      }
    })();
  }, []);

  // ✅ Save flags whenever they change
  useEffect(() => {
    (async () => {
      try {
        const json = JSON.stringify(flags);
        if (Platform.OS === "web") {
          localStorage.setItem("featureFlags", json);
        } else {
          await AsyncStorage.setItem("featureFlags", json);
        }
      } catch (error) {
        console.warn("Error saving feature flags:", error);
      }
    })();
  }, [flags]);

  // ✅ Toggle function
  const toggleFlag = (key: keyof Flags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, toggleFlag }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  return context;
};
