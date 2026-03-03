import { useLayoutEffect } from "react";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import type { NavigationProp, NavigationState } from "@react-navigation/native";

export function useScheduleHeader(params: {
  navigation: Omit<
    NavigationProp<ReactNavigation.RootParamList>,
    "getState"
  > & {
    getState(): NavigationState | undefined;
  };
  title?: string;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const {
    navigation,
    title = "Schedule a Match",
    onSubmit,
    isPending,
  } = params;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title={title} />}
          right={
            <Button
              type="custom"
              label="Schedule"
              onPress={onSubmit}
              loading={isPending}
              isInteractive={!isPending}
            />
          }
        />
      ),
    });
  }, [isPending, navigation, onSubmit, title]);
}
