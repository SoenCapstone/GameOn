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
  style,
  refreshControl,
  scrollRef,
  onContentSizeChange,
}: Readonly<ContentAreaProps>) {
  return (
    <>
      {background && <Background {...background} />}
      <KeyboardAwareScrollView
        bottomOffset={30}
        contentInsetAdjustmentBehavior="always"
        contentInset={tabs ? { top: 50 } : undefined}
        scrollIndicatorInsets={tabs ? { top: 52 } : undefined}
        contentContainerStyle={[styles.contentContainer, style]}
        onContentSizeChange={onContentSizeChange}
        ref={scrollRef}
        refreshControl={refreshControl}
        style={styles.scrollView}
      >
        {children}
      </KeyboardAwareScrollView>
      {tabs && <Tabs {...tabs} />}
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
