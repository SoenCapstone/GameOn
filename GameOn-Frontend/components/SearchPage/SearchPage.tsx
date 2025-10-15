import React, { useRef, useContext } from 'react';
import { ScrollView, Pressable, View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassView } from 'expo-glass-effect';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { searchStyles, HEADER_BASE_HEIGHT, SearchResult } from './constants';
import { createScopedLog } from '@/utils/logger';
import { useSearch } from '@/contexts/SearchContext';
import { Stack } from 'expo-router';
import { setTabBarHidden, getOverlayHeight } from '@/utils/tabbar-visibility';
import { HeaderHeightContext } from '@react-navigation/elements';

export default function SearchPage() {

  const log = createScopedLog('Search');
  const { query, results, markRendered, setQuery } = useSearch();
  const renderT0 = useRef<number | null>(null);
  const renderLogged = useRef(false);
  const headerHeight = useContext(HeaderHeightContext);
  const insets = useSafeAreaInsets();

  const uiLog = createScopedLog('Search.ui');

  // Hide parent tab bar while this screen is focused
  React.useEffect(() => {
    setTabBarHidden(true);
    return () => {
      setTabBarHidden(false);
    };
  }, [uiLog]);

    // prefer high-resolution timer when available
    const now = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  
    // Start timing when results change
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
      
      // Navigate to team or league page
    };
  
    const renderSearchResult = ({ item }: { item: SearchResult }) => (
      <Pressable key={item.id} onPress={() => handleResultPress(item)} style={searchStyles.pressableWrapper}>
        <GlassView isInteractive={true} glassEffectStyle='clear' style={searchStyles.resultCard}>
          <View style={searchStyles.resultRow}>
            <View style={searchStyles.logoContainer}>
              <Text style={searchStyles.logoText}>{item.logo}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={searchStyles.nameText}>{item.name}</Text>
              <Text style={searchStyles.subtitleText}>{item.subtitle}</Text>
            </View>
            <View style={searchStyles.rightIconContainer}>
              <IconSymbol name="chevron.right" size={16} color="#FFFFFF60" />
            </View>
          </View>
        </GlassView>
      </Pressable>
    );

  return (

    <SafeAreaView style={searchStyles.container}>
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
        style={searchStyles.topGradient}
        pointerEvents="none"
        />

        {/* Search Results */}
        <ScrollView
          style={searchStyles.scrollContainer}
          contentContainerStyle={{
            ...searchStyles.resultsContentStatic,
            marginTop: (headerHeight ?? HEADER_BASE_HEIGHT) - HEADER_BASE_HEIGHT,
            paddingBottom: getOverlayHeight(insets.bottom),
          }}
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
          <View style={searchStyles.resultsWrapper}>
            {results.map((item) => renderSearchResult({ item }))}
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}
