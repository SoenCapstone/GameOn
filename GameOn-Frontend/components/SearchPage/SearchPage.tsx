import React, { useRef, useContext } from 'react';
import { FlatList, Pressable, View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassView } from 'expo-glass-effect';
import { Host, Picker } from '@expo/ui/swift-ui';
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
  const { query, results, markRendered, setQuery, notifyModeChange } = useSearch();
  const q = (query || '').toLowerCase().trim();
  const renderT0 = useRef<number | null>(null);
  const renderLogged = useRef(false);
  const headerHeight = useContext(HeaderHeightContext);
  const insets = useSafeAreaInsets();

  const uiLog = createScopedLog('Search.ui');
  const [mode, setMode] = React.useState<'teams' | 'leagues'>('teams');
  const [searchActive, setSearchActive] = React.useState(false);

  // log when mode changes
  React.useEffect(() => {
    const cnt = results.filter((r) => (mode === 'teams' ? r.type === 'team' : r.type === 'league')).length;
    try {
      notifyModeChange(mode, cnt);
    } catch {
      uiLog.info('mode changed (fallback)', { mode, resultCount: cnt });
    }
  }, [mode, notifyModeChange, results, uiLog]);

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
  
    const handleResultPress = React.useCallback((result: SearchResult) => {
      log.info('search result pressed', { 
        resultId: result.id,
        resultName: result.name,
        resultType: result.type
      });
      
      // Navigate to team or league page
    }, [log]);
  
    const renderItem = React.useCallback(({ item }: { item: SearchResult }) => (
      <Pressable onPress={() => handleResultPress(item)} style={searchStyles.pressableWrapper}>
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
    ), [handleResultPress]);

  const displayedResults = React.useMemo(() => {
    if (!q && searchActive) return [] as SearchResult[];

    const list = results
      .filter((r) => (mode === 'teams' ? r.type === 'team' : r.type === 'league'))
      .filter((r) => {
        if (mode === 'teams') return r.name.toLowerCase().includes(q);
        return r.name.toLowerCase().includes(q);
      });

    return list;
  }, [results, mode, q, searchActive]);

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
        onFocus: () => setSearchActive(true),
        onBlur: () => setSearchActive(false),
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

          <Host matchContents>
            <Picker
              options={['Teams', 'Leagues']}
              selectedIndex={mode === 'teams' ? 0 : 1}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setMode(index === 0 ? 'teams' : 'leagues');
              }}
              variant="segmented"
            />
          </Host>

        {/* Search Results */}
        <FlatList
          data={displayedResults}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            ...searchStyles.resultsContentStatic,
            marginTop: (headerHeight ?? HEADER_BASE_HEIGHT) - HEADER_BASE_HEIGHT,
            paddingBottom: getOverlayHeight(insets.bottom),
          }}
          onContentSizeChange={() => {
            if (renderT0.current !== null && !renderLogged.current) {
              const took = Math.max(0, Math.round(now() - renderT0.current));
              try {
                const displayedCount = displayedResults.length;
                markRendered(took, { mode, resultCount: displayedCount, query });
              } catch {
                uiLog.info('render completed (fallback)', { query, resultCount: results.length, tookMs: took });
              }
              renderLogged.current = true;
            }
          }}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
    </SafeAreaView>
  );
}
