import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { SearchProvider } from '@/contexts/SearchContext';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  useColorScheme();

  return (
    <SearchProvider>
      <NativeTabs>
      <NativeTabs.Trigger
        name="index">
          <Label>Home</Label>
          <Icon sf="house.fill"/>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="search">
          <Label>Explore</Label>
          <Icon sf="paperplane.fill"/>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="explore">
          <Label>Explore-old</Label>
          <Icon sf="paperplane.fill"/>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="home">
          <Label>Main</Label>
          <Icon sf="house.fill"/>
      </NativeTabs.Trigger>
    </NativeTabs>
    </SearchProvider>
  );
}
