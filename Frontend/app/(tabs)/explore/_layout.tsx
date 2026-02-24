import { Stack } from "expo-router";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { useSearch } from "@/contexts/search-context";
import { Logo } from "@/components/header/logo";

const browseHeader = () => (
  <Header left={<Logo />} center={<PageTitle title="Explore" />} />
);

export default function ExploreLayout() {
  const { setQuery, setSearchActive } = useSearch();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerBackVisible: false,
          headerTitle: browseHeader,
          headerTransparent: true,
          headerSearchBarOptions: {
            hideNavigationBar: false,
            placement: "integrated",
            onChangeText: (event) => {
              const text = event.nativeEvent.text || "";
              setQuery(text);
            },
            onFocus: () => setSearchActive(true),
            onBlur: () => setSearchActive(false),
          },
        }}
      />
    </Stack>
  );
}
