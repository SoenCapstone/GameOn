import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchStyles } from '@/components/SearchPage/constants';
import { LinearGradient } from 'expo-linear-gradient';

export default function Home() {

  return (
    <SafeAreaView style={searchStyles.container}>

      <LinearGradient
              colors={['#0C456E', 'rgba(0,0,0,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={searchStyles.topGradient}
              pointerEvents="none"
            />
      

    </SafeAreaView>
  );
}
