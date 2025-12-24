import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AccentColorProvider } from "@/contexts/accent-color-context";

interface FormProps {
  readonly children: ReactNode;
  readonly accentColor: string;
}

export function Form({ children, accentColor }: Readonly<FormProps>) {
  return (
    <AccentColorProvider color={accentColor}>
      <View style={styles.form}>{children}</View>
    </AccentColorProvider>
  );
}

const styles = StyleSheet.create({
  form: { gap: 22 },
});
