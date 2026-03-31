import { Stack } from "expo-router";
import { SearchResultsScreen } from "@/components/search/search-results-screen";
import type { SearchValue } from "@/constants/search";
import { useSearch } from "@/hooks/search/use-search";
import { ContentArea } from "@/components/ui/content-area";
import { Logo } from "@/components/header/logo";

function ExploreToolbar({ search }: { readonly search: SearchValue }) {
  const { setQuery, setSearchActive } = search;
  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <Logo />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Screen.Title>Explore</Stack.Screen.Title>
      <Stack.SearchBar
        placement="integrated"
        onChangeText={(event) => {
          const text = event.nativeEvent.text || "";
          setQuery(text);
        }}
        onFocus={() => setSearchActive(true)}
        onBlur={() => setSearchActive(false)}
      />
    </>
  );
}

export default function Explore() {
  const search = useSearch({
    member: false,
    public: true,
    scope: "Explore Page",
  });
  const { searchActive } = search;

  return (
    <ContentArea
      toolbar={<ExploreToolbar search={search} />}
      background={{
        preset: "red",
      }}
    >
      {searchActive && (
        <SearchResultsScreen
          scope="Explore Page"
          search={search}
        />
      )}
    </ContentArea>
  );
}
