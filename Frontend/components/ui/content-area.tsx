import { ComponentProps, ReactNode, ReactElement } from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  RefreshControlProps,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Background } from "@/components/ui/background";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

interface ContentAreaProps {
  readonly children: ReactNode;
  readonly backgroundProps?: ComponentProps<typeof Background>;
  readonly segmentedControl?: boolean;
  readonly scrollable?: boolean;
  readonly paddingBottom?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly auth?: boolean;
  readonly refreshControl?: ReactElement<RefreshControlProps>;
}

export function ContentArea({
  children,
  backgroundProps,
  segmentedControl,
  scrollable,
  paddingBottom,
  style,
  auth,
  refreshControl,
}: Readonly<ContentAreaProps>) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const Container = scrollable ? KeyboardAwareScrollView : View;

  return (
    <>
      {backgroundProps && <Background {...backgroundProps} />}
      <Container
        bottomOffset={30}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (paddingBottom ?? 0),
          gap: 14,
        }}
        style={[
          styles.content,
          {
            paddingTop: headerHeight + (auth ? 18 : 8),
            paddingBottom: insets.bottom,
          },
          style,
        ]}
        {...(scrollable && refreshControl ? { refreshControl } : {})}
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
  },
});
