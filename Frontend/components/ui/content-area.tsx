import {
  ComponentProps,
  ComponentRef,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";
import {
  StyleSheet,
  StyleProp,
  ViewStyle,
  RefreshControlProps,
} from "react-native";
import { Background } from "@/components/ui/background";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Tabs } from "@/components/ui/tabs";

interface ContentAreaProps {
  readonly children: ReactNode;
  readonly background?: ComponentProps<typeof Background>;
  readonly tabs?: ComponentProps<typeof Tabs>;
  readonly toolbar?: ReactElement;
  readonly sticky?: {
    element: ReactElement;
    height: number;
  };
  readonly style?: StyleProp<ViewStyle>;
  readonly refreshControl?: ReactElement<RefreshControlProps>;
  readonly scrollRef?: RefObject<ComponentRef<typeof KeyboardAwareScrollView>>;
  readonly onContentSizeChange?: ComponentProps<
    typeof KeyboardAwareScrollView
  >["onContentSizeChange"];
}

export function ContentArea({
  children,
  background,
  tabs,
  toolbar,
  sticky,
  style,
  refreshControl,
  scrollRef,
  onContentSizeChange,
}: Readonly<ContentAreaProps>) {
  const contentInset = tabs
    ? { top: 50 }
    : sticky
      ? { top: sticky.height + 14 }
      : undefined;

  const scrollIndicatorInset = tabs
    ? { top: 52 }
    : sticky
      ? { top: sticky.height + 14 }
      : undefined;

  return (
    <>
      {background && <Background {...background} />}
      <KeyboardAwareScrollView
        bottomOffset={30}
        contentInsetAdjustmentBehavior="always"
        contentInset={contentInset}
        scrollIndicatorInsets={scrollIndicatorInset}
        contentContainerStyle={[styles.contentContainer, style]}
        onContentSizeChange={onContentSizeChange}
        ref={scrollRef}
        refreshControl={refreshControl}
        style={styles.scrollView}
      >
        {children}
      </KeyboardAwareScrollView>
      {tabs && <Tabs {...tabs} />}
      {sticky?.element}
      {toolbar}
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
