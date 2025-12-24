import React, { ReactNode } from "react";
import { Text, View, StyleSheet } from "react-native";

interface FormSectionProps {
  readonly header?: string;
  readonly children: ReactNode;
  readonly footer?: string;
}

export function FormSection({
  header,
  children,
  footer,
}: Readonly<FormSectionProps>) {
  return (
    <View>
      {header && <Text style={styles.header}>{header}</Text>}
      <View style={styles.content}>{children}</View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: 16,
    color: "rgba(235,235,245,0.6)",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
  },
  content: {
    marginTop: 10,
    gap: 16,
  },
  footer: {
    marginHorizontal: 16,
    marginTop: 10,
    color: "rgba(235,235,245,0.6)",
    fontSize: 13,
    lineHeight: 18,
  },
});
