import React, { useRef } from 'react';
import { Pressable, View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassView } from 'expo-glass-effect';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { LegendList } from "@legendapp/list";
import { searchStyles, SearchResult } from '@/components/SearchPage/constants';
import { createScopedLog } from '@/utils/logger';
import { useSearch } from '@/contexts/SearchContext';
import { Background } from "@/components/background";
import ContentArea from "@/components/content-area";

export default function SearchPage() {

  const log = createScopedLog('Search');
  const { query, results, markRendered, notifyModeChange, searchActive } = useSearch();
  const q = (query || '').toLowerCase().trim();
  const renderT0 = useRef<number | null>(null);
  const renderLogged = useRef(false);

  const uiLog = createScopedLog('Search.ui');
  const [mode, setMode] = React.useState<'teams' | 'leagues'>('teams');

  // log when mode changes
  React.useEffect(() => {
    const cnt = results.filter((r) => (mode === 'teams' ? r.type === 'team' : r.type === 'league')).length;
    try {
      notifyModeChange(mode, cnt);
    } catch {
      uiLog.info('mode changed (fallback)', { mode, resultCount: cnt });
    }
  }, [mode, notifyModeChange, results, uiLog]);

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

    <ContentArea>
        <Background preset='blue' mode='default'/>

        <SegmentedControl
          values={['Teams', 'Leagues']}
          selectedIndex={mode === 'teams' ? 0 : 1}
          onValueChange={(value) => {
            setMode(value === 'Teams' ? 'teams' : 'leagues');
          }}
        />

        {/* Search Results */}
        <LegendList
          data={displayedResults}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            ...searchStyles.resultsContentStatic,
            marginTop: 15
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
          recycleItems={true}
        />
    </ContentArea>
  );
}
