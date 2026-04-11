import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshControl, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { SearchResultsScreen } from "@/components/search/search-results-screen";
import type { SearchValue } from "@/constants/search";
import { ContentArea } from "@/components/ui/content-area";
import { useHeaderHeight } from "@/hooks/use-header-height";
import { Logo } from "@/components/header/logo";
import { MatchListSections } from "@/components/matches/match-list-sections";
import { useSearch } from "@/hooks/search/use-search";
import { useExploreMatches } from "@/hooks/use-explore-matches";
import { useExplorePreferences } from "@/hooks/use-explore-preferences";
import { useExploreVenues } from "@/hooks/use-explore-venues";
import { useLeaguesByIds, useTeamsByIds } from "@/hooks/use-matches";
import MapView, { Marker } from "react-native-maps";
import { Callout } from "@/components/maps/callout";
import { GlassView } from "expo-glass-effect";
import type { ExploreMatchesFilter } from "@/types/explore";
import { errorToString } from "@/utils/error";
import {
  exploreLeagueIds,
  exploreMapRegion,
  exploreMatchContextLabel,
  exploreTeamIds,
  filterExploreMatches,
  getExploreMatches,
  hideMarkerCallouts,
  trackMarker,
  type MarkerHandle,
} from "@/utils/explore";
import { buildMatchCards, splitMatchSections } from "@/utils/matches";
import {
  RelativePathString,
  Stack,
  useFocusEffect,
  useRouter,
} from "expo-router";
import {
  defaultExplorePreferences,
  exploreMatchesQueryKey,
  exploreRangeOptions,
  filterOptions,
} from "@/constants/explore";

function ExploreToolbar({
  search,
  filter,
  onFilterChange,
}: {
  readonly search: SearchValue;
  readonly filter: ExploreMatchesFilter;
  readonly onFilterChange: (next: ExploreMatchesFilter) => void;
}) {
  const { setQuery, setSearchActive } = search;
  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <Logo />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Screen.Title>Explore</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis" title="Match type">
          {filterOptions.map((option) => (
            <Stack.Toolbar.MenuAction
              key={option.value}
              isOn={filter === option.value}
              onPress={() => {
                if (filter !== option.value) {
                  onFilterChange(option.value);
                }
              }}
            >
              {option.label}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <Stack.SearchBar
        placement="integrated"
        onChangeText={(event) => {
          const text = event.nativeEvent.text || "";
          setQuery(text);
        }}
        onFocus={() => setSearchActive(true)}
        onBlur={() => setSearchActive(false)}
      />
    </>
  );
}

export default function Explore() {
  const mapRef = useRef<MapView>(null);
  const markerRefs = useRef(new Map<string, MarkerHandle>());
  const [filter, setFilter] = useState<ExploreMatchesFilter>("all");
  const [focusedVenue, setFocusedVenue] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const search = useSearch({
    member: false,
    public: true,
    scope: "Explore Page",
  });
  const { searchActive } = search;

  const { preferences, coordinates, load } = useExplorePreferences();

  const { matches, isLoading, isError, error, isRefreshing, refresh } =
    useExploreMatches({
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      rangeKm: preferences.rangeKm,
      sport: preferences.sport,
    });

  const venues = useExploreVenues(matches);

  const displayedMatches = getExploreMatches(
    filterExploreMatches(matches, filter, focusedVenue),
  );
  const teamIds = exploreTeamIds(displayedMatches);
  const leagueIds = exploreLeagueIds(displayedMatches);

  const teamsQuery = useTeamsByIds(teamIds);
  const leaguesQuery = useLeaguesByIds(leagueIds);

  const matchItems = buildMatchCards(
    displayedMatches,
    teamsQuery.data,
    (match) => exploreMatchContextLabel(match, leaguesQuery.data),
  );

  const { today, upcoming, past } = splitMatchSections(matchItems);

  const delta =
    exploreRangeOptions.find((o) => o.value === preferences.rangeKm)?.delta ??
    defaultExplorePreferences.delta;

  const mapRegion = useMemo(
    function () {
      return exploreMapRegion(
        coordinates?.latitude,
        coordinates?.longitude,
        delta,
      );
    },
    [coordinates?.latitude, coordinates?.longitude, delta],
  );

  useFocusEffect(
    useCallback(() => {
      load();
      void queryClient.refetchQueries({ queryKey: exploreMatchesQueryKey });
      hideMarkerCallouts(markerRefs);
      mapRef.current?.setRegion(mapRegion);
    }, [load, queryClient, mapRegion]),
  );

  const onRefresh = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refresh();
    hideMarkerCallouts(markerRefs);
    mapRef.current?.animateToRegion(mapRegion, 350);
  }, [refresh, mapRegion]);

  const map = (
    <GlassView style={[styles.glass, { top: headerHeight + 8 }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapPadding={{ top: 8, right: 8, bottom: 8, left: 8 }}
        region={mapRegion}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {Array.from(venues.values()).map((venue) => {
          if (venue.latitude == null || venue.longitude == null) return null;
          return (
            <Marker
              key={venue.id}
              ref={(m) => trackMarker(markerRefs, venue.id, m)}
              coordinate={{
                latitude: venue.latitude,
                longitude: venue.longitude,
              }}
              calloutOffset={{ x: 0, y: -40 }}
              onSelect={() => setFocusedVenue(venue.id)}
              onDeselect={() => setFocusedVenue(null)}
            >
              <Callout
                name={venue.name}
                detail={`${venue.street}, ${venue.city}, ${venue.province}`}
              />
            </Marker>
          );
        })}
      </MapView>
    </GlassView>
  );

  return (
    <ContentArea
      toolbar={
        <ExploreToolbar
          search={search}
          filter={filter}
          onFilterChange={setFilter}
        />
      }
      background={{ preset: "red" }}
      sticky={searchActive ? undefined : { element: map, height: 244 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {searchActive ? (
        <SearchResultsScreen scope="Explore Page" search={search} />
      ) : (
        <MatchListSections
          today={today}
          upcoming={upcoming}
          past={past}
          isLoading={
            isLoading || teamsQuery.isLoading || leaguesQuery.isLoading
          }
          errorText={isError ? errorToString(error) : null}
          onRetry={refresh}
          onMatchPress={(match) => {
            const source = matchItems.find((m) => m.id === match.id);
            const space = source?.leagueId ? "league" : "team";
            const spaceId = source?.leagueId ?? source?.homeTeamId ?? "";
            router.push({
              pathname: `/match/${match.id}` as RelativePathString,
              params: {
                space,
                spaceId,
                homeName: match.homeName,
                awayName: match.awayName,
                homeLogoUrl: match.homeLogoUrl ?? "",
                awayLogoUrl: match.awayLogoUrl ?? "",
              },
            });
          }}
        />
      )}
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  glass: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 244,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    borderRadius: 34,
  },
  map: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
    overflow: "hidden",
  },
});
