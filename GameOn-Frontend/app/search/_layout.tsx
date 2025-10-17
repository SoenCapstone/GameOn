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

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerBackVisible: false,
            headerTitle: () => (
              <Header
                left={<HeaderButton type="back" />}
                center={<PageTitle title="Search" />}
              />
            ),
            headerTransparent: true,
            headerSearchBarOptions: {
              hideNavigationBar: false,
            },
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
