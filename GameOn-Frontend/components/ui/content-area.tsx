import { ComponentProps, ReactNode } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Background } from "@/components/ui/background";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ContentAreaProps {
  readonly children: ReactNode;
  readonly backgroundProps?: ComponentProps<typeof Background>;
  readonly segmentedControl?: boolean;
  readonly scrollable?: boolean;
  readonly paddingBottom?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly auth?: boolean;
}

export function ContentArea({
  children,
  backgroundProps,
  segmentedControl,
  scrollable,
  paddingBottom,
  style,
  auth,
}: Readonly<ContentAreaProps>) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const Container = scrollable ? ScrollView : View;

  return (
    <>
      {backgroundProps && <Background {...backgroundProps} />}
      <Container
        contentContainerStyle={{
          paddingBottom: insets.bottom + (paddingBottom ?? 0),
          gap: 14,
        }}
        style={[
          styles.content,
          {
            paddingTop: headerHeight + (auth ? 28 : 8),
            paddingBottom: insets.bottom,
          },
          style,
        ]}
        {...(segmentedControl ? { stickyHeaderIndices: [0] } : {})}
      >
        {children}
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    rowGap: 14,
  },
});
