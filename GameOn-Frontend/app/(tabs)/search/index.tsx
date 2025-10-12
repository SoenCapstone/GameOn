// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   FlatList,
//   StatusBar,
//   TouchableOpacity,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { IconSymbol } from '@/components/ui/icon-symbol';
// import { createScopedLog } from '@/utils/logger';
// import { exploreStyles } from '@/constants/explore-styles';

// // Mock search results data
// const mockSearchResults: SearchResult[] = [
//   {
//     id: '1',
//     type: 'team',
//     name: 'FC Barcelona',
//     subtitle: 'Team in La Liga',
//     logo: '⚽',
//     league: 'La Liga',
//   },
//   {
//     id: '2',
//     type: 'team',
//     name: 'Real Madrid',
//     subtitle: 'Team in La Liga',
//     logo: '⚽',
//     league: 'La Liga',
//   },
//   {
//     id: '3',
//     type: 'team',
//     name: 'Manchester City',
//     subtitle: 'Team in Premier League',
//     logo: '⚽',
//     league: 'Premier League',
//   },
//   {
//     id: '4',
//     type: 'team',
//     name: 'Liverpool',
//     subtitle: 'Team in Premier League',
//     logo: '⚽',
//     league: 'Premier League',
//   },
//   {
//     id: '5',
//     type: 'team',
//     name: 'Bayern Munich',
//     subtitle: 'Team in Bundesliga',
//     logo: '⚽',
//     league: 'Bundesliga',
//   },
//   {
//     id: '6',
//     type: 'team',
//     name: 'Paris Saint-Germain',
//     subtitle: 'Team in Ligue 1',
//     logo: '⚽',
//     league: 'Ligue 1',
//   },
//   {
//     id: '7',
//     type: 'team',
//     name: 'AC Milan',
//     subtitle: 'Team in Serie A',
//     logo: '⚽',
//     league: 'Serie A',
//   },
//   {
//     id: '8',
//     type: 'team',
//     name: 'Inter Miami',
//     subtitle: 'Team in MLS',
//     logo: '⚽',
//     league: 'MLS',
//   },
//   {
//     id: '9',
//     type: 'league',
//     name: 'La Liga',
//     subtitle: 'Spanish League',
//     logo: '🇪🇸',
//     league: 'La Liga',
//   },
//   {
//     id: '10',
//     type: 'league',
//     name: 'Premier League',
//     subtitle: 'English League',
//     logo: '🇬🇧',
//     league: 'Premier League',
//   },
//   {
//     id: '11',
//     type: 'league',
//     name: 'Bundesliga',
//     subtitle: 'German League',
//     logo: '🇩🇪',
//     league: 'Bundesliga',
//   },
//   {
//     id: '12',
//     type: 'league',
//     name: 'Serie A',
//     subtitle: 'Italian League',
//     logo: '🇮🇹',
//     league: 'Serie A',
//   },
// ];

// interface SearchResult {
//   id: string;
//   type: 'team' | 'league';
//   name: string;
//   subtitle: string;
//   logo: string;
//   league: string;
// }

// const log = createScopedLog('explore.search');

// export default function Search() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

//   // Log component initialization
//   React.useEffect(() => {
//     log.info('explore screen initialized', { 
//       defaultQuery: ''
//     });
//   }, []);

//   useEffect(() => {
//     const t0 = Date.now();
//     log.debug('filtering search results', { 
//       searchQuery: searchQuery || '(empty)',
//     });

//     // Filter search results based on query
//     let filtered: SearchResult[] = [];
    
//     if (searchQuery.trim() === '') {
//       // Show all results when search is empty
//       filtered = mockSearchResults;
//     } else {
//       // Filter results that match the search query (case-insensitive)
//       const query = searchQuery.toLowerCase().trim();
//       filtered = mockSearchResults.filter(result => 
//         result.name.toLowerCase().includes(query) ||
//         result.subtitle.toLowerCase().includes(query) ||
//         result.league.toLowerCase().includes(query)
//       );
//     }
    
//     setSearchResults(filtered);
//     log.info('search filtering completed', { 
//       resultCount: filtered.length, 
//       tookMs: Date.now() - t0,
//       query: searchQuery
//     });
//   }, [searchQuery]);

//   const handleResultPress = (result: SearchResult) => {
//     log.info('search result pressed', { 
//       resultId: result.id,
//       resultName: result.name,
//       resultType: result.type
//     });
    
//     // Navigate to team or league page
//   };

//   const renderSearchResult = ({ item }: { item: SearchResult }) => (
//     <TouchableOpacity
//       style={exploreStyles.searchResultItem}
//       onPress={() => handleResultPress(item)}
//     >
//       <View style={exploreStyles.searchResultInfo}>
//         <View style={exploreStyles.searchResultLogo}>
//           <Text style={exploreStyles.searchResultLogoText}>{item.logo}</Text>
//         </View>
//         <View style={exploreStyles.searchResultDetails}>
//           <Text style={exploreStyles.searchResultName}>{item.name}</Text>
//           <Text style={exploreStyles.searchResultSubtitle}>{item.subtitle}</Text>
//         </View>
//       </View>
//       <IconSymbol name="chevron.right" size={16} color="#FFFFFF60" />
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={exploreStyles.container}>
//       <StatusBar barStyle="light-content" />
      
//       <LinearGradient
//         colors={['#0C456E', 'rgba(0,0,0,0)']}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 0, y: 1 }}
//         style={exploreStyles.topGradient}
//         pointerEvents="none"
//       />

//       {/* Search Input */}
//       <View style={exploreStyles.searchContainer}>
//         <View style={exploreStyles.SearchWrapper}>
//           <IconSymbol name="magnifyingglass" size={20} color="#FFFFFF80" style={exploreStyles.searchIcon} />
//           <TextInput
//             style={exploreStyles.SearchInput}
//             placeholder="Search teams and leagues..."
//             placeholderTextColor="#FFFFFF60"
//             value={searchQuery}
//             onChangeText={(text: string) => {
//               log.debug('search query changed', { 
//                 query: text || '(empty)', 
//                 length: text.length 
//               });
//               setSearchQuery(text);
//             }}
//             autoCapitalize="none"
//             autoCorrect={false}
//           />
//           {searchQuery.length > 0 && (
//             <TouchableOpacity
//               onPress={() => setSearchQuery('')}
//               style={exploreStyles.clearButton}
//             >
//               <IconSymbol name="xmark.circle.fill" size={18} color="#FFFFFF60" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Search Results */}
//       <FlatList
//         data={searchResults}
//         renderItem={renderSearchResult}
//         keyExtractor={(item) => item.id}
//         style={exploreStyles.searchResultsList}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={exploreStyles.searchResultsContent}
//       />
//     </SafeAreaView>
//   );
// }
import React, { useRef } from 'react';
import { Host, TextField, Button, List, HStack, VStack, Section, Form, Switch, Text, GlassEffectContainer} from '@expo/ui/swift-ui';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { exploreStyles } from '@/constants/explore-styles';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { View, ScrollView, FlatList } from 'react-native';
import { background, frame } from '@expo/ui/swift-ui/modifiers';
import { createScopedLog } from '@/utils/logger';
import { useSearch } from '@/contexts/SearchContext';
import { SearchResult } from '@/utils/search';

export default function Search() {

  const log = createScopedLog('Search');
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
  
    const handleResultPress = (result: SearchResult) => {
      log.info('search result pressed', { 
        resultId: result.id,
        resultName: result.name,
        resultType: result.type
      });
      
      // Navigate to team or league page (TODO)
    };
  
    const renderSearchResult = ({ item }: { item: SearchResult }) => (
      <Host style={{ flex: 1, height: '100%', width: '100%', alignSelf: 'center'}} matchContents>
        <VStack spacing={5}>
          <VStack spacing={5}>
            <Button controlSize='extraLarge' color='#FFFFFF' onPress={() => handleResultPress(item)} variant='glass'>
              <HStack spacing={6}>
                <Text>{item.logo}</Text>
                <VStack alignment='leading' modifiers={[frame({ height: 40, width: 255, alignment: 'topLeading' })]}>
                  <Text>{item.name}</Text>
                  <Text size={12} color='#FFFFFF80'>{item.subtitle}</Text>
                </VStack>
              </HStack>
            </Button>
          </VStack>
        </VStack>
      </Host>
    );

    const separator = () => <View style={{ height: 10 }} />;
  

  return (

    <SafeAreaView style={exploreStyles.container}>
        <LinearGradient
        colors={['#0C456E', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={exploreStyles.topGradient}
        pointerEvents="none"
      />

      {/* Search Results (from SearchContext) */}
        <FlatList
        data={results}
        renderItem={renderSearchResult}
        ItemSeparatorComponent={separator}
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