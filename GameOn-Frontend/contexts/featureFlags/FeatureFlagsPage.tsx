import React from "react";
import { useFeatureFlags } from "./FeatureFlagsContext";

export default function FeatureFlagsPage() {
  const { flags, toggleFlag } = useFeatureFlags();

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Feature Flags</h2>
      {Object.entries(flags).map(([key, value]) => (
        <div key={key} style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="checkbox"
              checked={value}
              onChange={() => toggleFlag(key as keyof typeof flags)}
            />
            {key}
          </label>
        </div>
      ))}
    </div>
  );
}
