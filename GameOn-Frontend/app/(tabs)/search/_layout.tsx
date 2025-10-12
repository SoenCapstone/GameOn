import { Stack } from "expo-router";
import { useSearch } from '@/contexts/SearchContext';
import { useColorScheme } from "react-native";
import React from "react";

export default function SearchLayout() {
  const { setQuery } = useSearch();

  useColorScheme();

    return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Search', 
          headerTransparent: true,
          headerStyle: { backgroundColor: '#0a324fff' },
          headerShadowVisible: false,
          headerTintColor: '#ffffff',
          headerSearchBarOptions: {
            placement: 'integratedButton',
            barTintColor: '#00000000',
            onChangeText: (event) => {
              const text = event.nativeEvent.text || '';
              setQuery(text);
            },
          },
        }}
      />
    </Stack>
  );
}