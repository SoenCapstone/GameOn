import React, { useRef, useContext } from 'react';
import { Host, Button, HStack, VStack, Text } from '@expo/ui/swift-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { exploreStyles } from '@/constants/explore-styles';
import { frame } from '@expo/ui/swift-ui/modifiers';
import { createScopedLog } from '@/utils/logger';
import { useSearch } from '@/contexts/SearchContext';
import { SearchResult } from '@/utils/search';
import { ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { HeaderHeightContext } from '@react-navigation/elements';

export default function Search() {

  const log = createScopedLog('Search');
  const { query, results, markRendered, setQuery } = useSearch();
  const renderT0 = useRef<number | null>(null);
  const renderLogged = useRef(false);
  const headerHeight = useContext(HeaderHeightContext);

  const uiLog = createScopedLog('explore.ui');

    // prefer high-resolution timer when available
    const now = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  
    // Start timing when results change (filter completed -> UI render start)
    React.useEffect(() => {
      renderT0.current = now();
      renderLogged.current = false;
    }, [results]);
  
    const handleResultPress = (result: SearchResult) => {
      log.info('search result pressed', { 
        resultId: result.id,
        resultName: result.name,
        resultType: result.type
      });
      
      // Navigate to team or league page (TODO)
    };
  
    const renderSearchResult = ({ item }: { item: SearchResult }) => (
      <Button key={item.id} controlSize='extraLarge' color='#FFFFFF' onPress={() => handleResultPress(item)} variant='glass'>
        <HStack spacing={6}>
          <Text>{item.logo}</Text>
          <VStack alignment='leading' modifiers={[frame({ height: 40, width: 255, alignment: 'topLeading' })]}>
            <Text>{item.name}</Text>
            <Text size={12} color='#FFFFFF80'>{item.subtitle}</Text>
          </VStack>
        </HStack>
      </Button>
    );

  return (

     

    <SafeAreaView style={exploreStyles.container}>
        <Stack.Screen
        options={{
            title: 'Search',
            headerTransparent: false,
            headerStyle: { backgroundColor: '#0C456E' },
            headerShadowVisible: false,
            headerTintColor: '#ffffff',
            headerSearchBarOptions: {
                placement: 'automatic',
                barTintColor: '#00000000',
                onChangeText: (event) => {
                    const text = event.nativeEvent.text || '';
                    setQuery(text);
                },
            },
        }}
        /> 

        <LinearGradient
        colors={['#0C456E', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={exploreStyles.topGradient}
        pointerEvents="none"
        />

        <ScrollView style={{ width: '100%', height: '80%' }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 10, marginTop: (headerHeight ?? 130) - 130, marginBottom: 70 }}
          onContentSizeChange={() => {
            if (renderT0.current !== null && !renderLogged.current) {
              const took = Math.max(0, Math.round(now() - renderT0.current));
              try {
                markRendered(took);
              } catch {
                uiLog.info('render completed (fallback)', { query, resultCount: results.length, tookMs: took });
              }
              renderLogged.current = true;
            }
          }}
        >
          <Host style={{ flex: 1, height: '100%', width: '100%', alignSelf: 'center'}} matchContents>
            <VStack spacing={10}>
              {results.map((item) => renderSearchResult({ item }))}
            </VStack>
          </Host>
        </ScrollView>
    </SafeAreaView>
  );
}