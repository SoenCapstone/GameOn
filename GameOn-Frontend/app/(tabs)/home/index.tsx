import { Stack } from 'expo-router';
import React, { useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { createScopedLog } from '@/utils/logger';
import { exploreStyles } from '@/constants/explore-styles';
import { useSearch } from '@/contexts/SearchContext';

const log = createScopedLog('explore.search');

export default function Home() {
  const { query, results, markRendered } = useSearch();
  const renderT0 = useRef<number | null>(null);
  const renderLogged = useRef(false);

  const uiLog = createScopedLog('explore.ui');

  // prefer high-resolution timer when available
  const now = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

  // Start timing when results change (filter completed -> UI render start)
  React.useEffect(() => {
    renderT0.current = now();
    renderLogged.current = false;
  }, [results]);

  const handleResultPress = (result: any) => {
    log.info('search result pressed', { 
      resultId: result.id,
      resultName: result.name,
      resultType: result.type
    });
    
    // Navigate to team or league page (TODO)
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={exploreStyles.searchResultItem}
      onPress={() => handleResultPress(item)}
    >
      <View style={exploreStyles.searchResultInfo}>
        <View style={exploreStyles.searchResultLogo}>
          <Text style={exploreStyles.searchResultLogoText}>{item.logo}</Text>
        </View>
        <View style={exploreStyles.searchResultDetails}>
          <Text style={exploreStyles.searchResultName}>{item.name}</Text>
          <Text style={exploreStyles.searchResultSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <IconSymbol name="chevron.right" size={16} color="#FFFFFF60" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={exploreStyles.container}>
      
      <Stack.Screen options={{ title: 'Home' }} />
      
      <LinearGradient
        colors={['#0C456E', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={exploreStyles.topGradient}
        pointerEvents="none"
      />

      {/* Search Results (from shared SearchContext) */}
      <FlatList
        data={results}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.id}
        style={exploreStyles.searchResultsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={exploreStyles.searchResultsContent}
        contentInsetAdjustmentBehavior="automatic"
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
      />
    </SafeAreaView>
  );
}
