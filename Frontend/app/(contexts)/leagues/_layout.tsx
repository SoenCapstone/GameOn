import { Stack, useLocalSearchParams } from "expo-router";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";

function LeagueHeader() {
  const { name } = useLocalSearchParams<{ name?: string }>();

  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title={name ?? "League"} />}
      right={<HeaderButton type="custom" icon="gearshape" />}
    />
  );
}

export default function LeaguesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]/index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => <LeagueHeader />,
        }}
      />
    </Stack>
  );
}
