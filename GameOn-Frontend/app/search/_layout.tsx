import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import Header from "@/components/header";
import PageTitle from "@/components/page-title";
import HeaderButton from "@/components/header-button";
import { useSearch } from "@/contexts/SearchContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

const SearchHeaderTitle: React.FC<{ title: string }> = ({ title }) => (
  <Header
    left={<HeaderButton type="back" />}
    center={<PageTitle title={title} />}
  />
);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { setQuery, setSearchActive } = useSearch();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerBackVisible: false,
            headerTitle: () => <SearchHeaderTitle title="Search" />,
            headerTransparent: true,
            headerSearchBarOptions: {
              hideNavigationBar: false,
              placement: 'automatic',
              onChangeText: (event) => {
                const text = event.nativeEvent.text || '';
                setQuery(text);
              },
              onFocus: () => setSearchActive(true),
              onBlur: () => setSearchActive(false),
            },
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
