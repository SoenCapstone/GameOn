import { View, StyleSheet } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";

interface ContentAreaProps {
  readonly children: React.ReactNode;
}

export function ContentArea({ children }: Readonly<ContentAreaProps>) {
  const headerHeight = useHeaderHeight();

  return (
    <View style={[styles.content, { paddingTop: headerHeight + 8 }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    rowGap: 14,
  },
});
