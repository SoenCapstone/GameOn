import React from "react";
import { Stack } from "expo-router";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/contexts/search-context";

interface ContextStackConfig {
  readonly create?: { name: string; title: string };
  readonly indexName: string;
  readonly extraScreens?: string[];
  readonly enableSearchBar?: boolean;
}

const transparentOptions = {
  headerTransparent: true,
  headerShadowVisible: false,
};

const backlessOptions = {
  ...transparentOptions,
  headerBackVisible: false,
};

function buildCreateHeader(title: string) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title={title} />}
    />
  );
}

export function useContextStackScreens({
  create,
  indexName,
  extraScreens = [],
  enableSearchBar = false,
}: Readonly<ContextStackConfig>) {
  const { setQuery, setSearchActive } = useSearch();

  const searchBarOptions: NativeStackNavigationOptions["headerSearchBarOptions"] =
    {
      hideNavigationBar: false,
      placement: "automatic",
      onChangeText: (event: any) => {
        const text = event?.nativeEvent?.text ?? "";
        setQuery(text);
      },
      onFocus: () => setSearchActive(true),
      onBlur: () => setSearchActive(false),
    };

  const screens = [
    create && (
      <Stack.Screen
        key={create.name}
        name={create.name}
        options={{
          ...transparentOptions,
          headerTitle: () => buildCreateHeader(create.title),
        }}
      />
    ),
    <Stack.Screen
      key={indexName}
      name={indexName}
      options={{
        ...backlessOptions,
        ...(enableSearchBar && { headerSearchBarOptions: searchBarOptions }),
      }}
    />,
    ...extraScreens.map((name) => (
      <Stack.Screen key={name} name={name} options={backlessOptions} />
    )),
  ].filter(Boolean);

  return screens;
}
