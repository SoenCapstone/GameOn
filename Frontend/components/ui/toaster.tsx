import { StyleSheet } from "react-native";
import { GlassView } from "expo-glass-effect";
import { Toaster as SonnerToaster } from "sonner-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type React from "react";

export function Toaster() {
  const insets = useSafeAreaInsets();

  return (
    <SonnerToaster
      offset={insets.top - 4}
      toastOptions={{
        backgroundComponent: (
          <GlassView style={[StyleSheet.absoluteFill, styles.glass]} />
        ),
      }}
      icons={{
        info: null,
        success: <IconSymbol name="checkmark.circle.fill" size={20} />,
        error: <IconSymbol name="xmark.circle.fill" size={20} />,
        warning: <IconSymbol name="exclamationmark.triangle.fill" size={20} />,
      }}
    />
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 30,
  },
});
