/**
 * Current version: Local-only feature flag persistence using AsyncStorage or localStorage.
 * Next phase: Integrate with backend or remote config service to allow
 * global propagation of flag states across all devices.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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

// 🧠 Future enhancement: sync feature flags with backend for global propagation
const syncWithServer = async (updatedFlags: Record<string, boolean>) => {
  try {
    // Example placeholder for future API sync
    // await fetch(`${API_URL}/feature-flags`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(updatedFlags),
    // });
    console.log("Feature flags would sync globally here:", updatedFlags);
  } catch (error) {
    console.error("Failed to sync flags globally:", error);
  }
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Flags>({
    newUI: false,
    betaMode: false,
  });

  // ✅ Load flags on startup
  useEffect(() => {
    (async () => {
      try {
        const json =
          Platform.OS === "web"
            ? localStorage.getItem("featureFlags")
            : await AsyncStorage.getItem("featureFlags");

        if (json) setFlags(JSON.parse(json));
      } catch (error) {
        console.warn("Error loading feature flags:", error);
      }
    })();
  }, []);

  // ✅ Save flags on change
  useEffect(() => {
    (async () => {
      try {
        const json = JSON.stringify(flags);
        if (Platform.OS === "web") localStorage.setItem("featureFlags", json);
        else await AsyncStorage.setItem("featureFlags", json);
        await syncWithServer(flags); // Placeholder global sync
      } catch (error) {
        console.warn("Error saving feature flags:", error);
      }
    })();
  }, [flags]);

  const toggleFlag = (key: keyof Flags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ✅ useMemo prevents Sonar warning: “object changes every render”
  const value = useMemo(() => ({ flags, toggleFlag }), [flags]);

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  return context;
};
