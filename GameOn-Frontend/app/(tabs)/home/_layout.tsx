import { router, Stack } from "expo-router";
import { Pressable, useColorScheme } from "react-native";
import React from "react";
import { SymbolView } from "expo-symbols";

export default function HomeLayout() {

  useColorScheme();

    return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Home', 
          headerTransparent: true,
          headerStyle: { backgroundColor: '#0a324fff' },
          headerShadowVisible: false,
          headerTintColor: '#ffffff',
          headerRight: () => (
                <Pressable
                    style={{
                        alignItems: 'center',
                        height: '100%',
                        width: 36,
                        alignSelf: 'center',
                    }}
                    onPress={() => router.push('/home/search')}
                >
                    <SymbolView name="magnifyingglass" tintColor="white" />
                </Pressable>
            ),
        }}
      />
    </Stack>
  );
}