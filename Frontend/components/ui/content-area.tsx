import {
  ComponentProps,
  ComponentRef,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  RefreshControlProps,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Background } from "@/components/ui/background";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

interface ContentAreaProps {
  readonly children: ReactNode;
  readonly backgroundProps?: ComponentProps<typeof Background>;
  readonly tabs?: boolean;
  readonly scrollable?: boolean;
  readonly paddingBottom?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly auth?: boolean;
  readonly progressiveBlur?: boolean;
  readonly refreshControl?: ReactElement<RefreshControlProps>;
  readonly scrollRef?: RefObject<ComponentRef<typeof KeyboardAwareScrollView>>;
  readonly onContentSizeChange?: ComponentProps<
    typeof KeyboardAwareScrollView
  >["onContentSizeChange"];
}

export function ContentArea({
  children,
  backgroundProps,
  tabs,
  scrollable,
  paddingBottom,
  style,
  auth,
  progressiveBlur,
  refreshControl,
  scrollRef,
  onContentSizeChange,
}: Readonly<ContentAreaProps>) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const Container = scrollable ? KeyboardAwareScrollView : View;

  const content = (
    <Container
      bottomOffset={30}
      contentContainerStyle={{
        paddingBottom: insets.bottom + (paddingBottom ?? 0),
        gap: 14,
      }}
      {...(scrollable ? { ref: scrollRef, onContentSizeChange } : {})}
      style={[
        styles.content,
        {
          paddingTop: headerHeight + (auth ? 18 : 8),
          paddingBottom: insets.bottom,
        },
        style,
      ]}
      {...(scrollable && refreshControl ? { refreshControl } : {})}
      {...(tabs ? { stickyHeaderIndices: [0] } : {})}
    >
      {children}
    </Container>
  );

  return (
    <>
      {backgroundProps && <Background {...backgroundProps} />}
      {progressiveBlur ? (
        <View style={styles.wrapper}>
          {content}
          <ProgressiveBlur />
        </View>
      ) : (
        content
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
