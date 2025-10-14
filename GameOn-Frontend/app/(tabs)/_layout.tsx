import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import React, { useEffect, useState } from 'react';
import { SearchProvider } from '@/contexts/SearchContext';
import { subscribe, getOverlayHeight } from '@/utils/tabbar-visibility';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  useColorScheme();

  const [hidden, setHidden] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsub = subscribe(setHidden);
    return unsub;
  }, []);

  return (
    <SearchProvider>
      <View style={{ flex: 1 }}>
        <NativeTabs>
      <NativeTabs.Trigger
        name="index">
          <Label>Home</Label>
          <Icon sf="house.fill"/>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="home">
          <Label>Main</Label>
          <Icon sf="house.fill"/>
      </NativeTabs.Trigger>
        </NativeTabs>
        {hidden && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: getOverlayHeight(insets.bottom),
              backgroundColor: '#000',
              zIndex: 9999,
              elevation: 9999,
            }}
            pointerEvents="auto"
          />
        )}
      </View>
    </SearchProvider>
  );
}
