import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useSegments } from "expo-router";
import { updateTabsTitle } from "@/utils/tabs-title";
import * as Haptics from "expo-haptics";

export default function TabLayout() {
  const segments = useSegments();
  updateTabsTitle(segments);

  return (
    <NativeTabs
      screenListeners={{
        tabPress: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      }}
    >
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="text.rectangle.page"
          selectedColor="white"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(explore)">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="globe.europe.africa.fill"
          selectedColor="white"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(messages)">
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="message.fill" selectedColor="white" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(spaces)">
        <NativeTabs.Trigger.Label>Spaces</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="circle.grid.2x2.fill"
          selectedColor="white"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
