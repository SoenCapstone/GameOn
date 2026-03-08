import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { getSportLogo } from "@/components/browse/utils";
import { formatMatchDateTime } from "@/features/matches/utils";
import MapView, { Marker } from "react-native-maps";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface MatchDetailsContentProps {
  readonly startTime: string;
  readonly status: string;
  readonly homeTeamName: string;
  readonly awayTeamName: string;
  readonly homeScore?: number | null;
  readonly awayScore?: number | null;
  readonly homeTeamLogoUrl?: string | null;
  readonly awayTeamLogoUrl?: string | null;
  readonly sport?: string | null;
  readonly contextLabel: string;
  readonly refereeName?: string;
  readonly venueName?: string | null;
  readonly venueLocationLabel?: string | null;
  readonly venueAddress?: string | null;
  readonly venueLatitude?: number | null;
  readonly venueLongitude?: number | null;
}

export function MatchDetailsContent({
  startTime,
  status,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  homeTeamLogoUrl,
  awayTeamLogoUrl,
  sport,
  contextLabel,
  refereeName,
  venueName,
  venueLocationLabel,
  venueAddress,
  venueLatitude,
  venueLongitude,
}: Readonly<MatchDetailsContentProps>) {
  const hasScore = homeScore != null && awayScore != null;
  const centerValue =
    status === "CANCELLED" ? "Cancelled" : formatMatchDateTime(startTime);
  const hasCoordinates =
    typeof venueLatitude === "number" && typeof venueLongitude === "number";
  const hasVenue = Boolean(venueName?.trim());
  const hasReferee = Boolean(refereeName?.trim());
  const venueMetaLabel = venueLocationLabel?.trim()
    ? `${venueName}, ${venueLocationLabel}`
    : venueName;

  const openVenueDirections = async () => {
    const label = encodeURIComponent(venueName ?? "Venue");
    const query = encodeURIComponent(
      venueAddress?.trim() || venueName?.trim() || "Venue",
    );
    const appleMapsUrl = hasCoordinates
      ? `http://maps.apple.com/?daddr=${venueLatitude},${venueLongitude}&q=${label}`
      : `http://maps.apple.com/?daddr=${query}`;

    const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
    if (canOpenAppleMaps) {
      await Linking.openURL(appleMapsUrl);
      return;
    }

    Alert.alert(
      "Maps unavailable",
      "Could not open Apple Maps for directions on this device.",
    );
  };

  const handleMapPress = () => {
    if (!venueName && !venueAddress) return;

    Alert.alert("Open in Maps", "Get directions to this venue in Maps.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Open",
        onPress: () => {
          void openVenueDirections();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.summary}>
          <View style={styles.top}>
            <Image
              source={
                homeTeamLogoUrl ? { uri: homeTeamLogoUrl } : getSportLogo(sport)
              }
              style={styles.logo}
              contentFit="contain"
            />

            <View style={styles.middle}>
              <Text style={styles.context} numberOfLines={1}>
                {contextLabel}
              </Text>
              {status === "CANCELLED" && (
                <Text style={styles.pending}>Cancelled</Text>
              )}
              {status !== "CANCELLED" && hasScore && (
                <View style={styles.result}>
                  <Text style={styles.score}>{homeScore}</Text>
                  <Text style={styles.dash}>-</Text>
                  <Text style={styles.score}>{awayScore}</Text>
                </View>
              )}
              {status !== "CANCELLED" && !hasScore && (
                <Text style={styles.date}>{centerValue}</Text>
              )}
            </View>

            <Image
              source={
                awayTeamLogoUrl ? { uri: awayTeamLogoUrl } : getSportLogo(sport)
              }
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <View style={styles.names}>
            <View style={styles.home}>
              <Text style={styles.name} numberOfLines={1}>
                {homeTeamName}
              </Text>
            </View>
            <View style={styles.away}>
              <Text style={styles.name} numberOfLines={1}>
                {awayTeamName}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.view}>
          <MapView
            style={styles.map}
            mapPadding={{ top: 8, right: 8, bottom: 8, left: 8 }}
            initialRegion={{
              latitude: venueLatitude ?? 45.5017,
              longitude: venueLongitude ?? -73.5673,
              latitudeDelta: hasCoordinates ? 0.01 : 0.12,
              longitudeDelta: hasCoordinates ? 0.01 : 0.12,
            }}
            scrollEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {hasCoordinates ? (
              <Marker
                onPress={handleMapPress}
                coordinate={{
                  latitude: venueLatitude,
                  longitude: venueLongitude,
                }}
              />
            ) : null}
          </MapView>
        </View>

        <View style={styles.metaBlock}>
          {hasVenue ? (
            <View style={styles.metaRow}>
              <IconSymbol name="mappin.and.ellipse" color="727272" size={18} />
              <View style={styles.metaTextRow}>
                <Text style={styles.meta}>Venue:</Text>
                <Text style={styles.metaWhite} numberOfLines={2}>
                  {venueMetaLabel}
                </Text>
              </View>
            </View>
          ) : null}
          {hasReferee ? (
            <View style={styles.metaRow}>
              <IconSymbol name="flag.fill" color="727272" size={15} />
              <View style={styles.metaTextRow}>
                <Text style={styles.meta}>Referee:</Text>
                <Text style={styles.metaWhite}>{refereeName}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 44,
  },
  content: {
    paddingHorizontal: 10,
  },
  summary: {
    gap: 10,
    paddingHorizontal: 12,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  logo: {
    width: 54,
    height: 54,
  },
  middle: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    maxWidth: "55%",
  },
  context: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 14,
  },
  date: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 14,
    textAlign: "center",
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 26,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  dash: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 26,
    fontWeight: "400",
    marginHorizontal: 32,
  },
  pending: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 14,
    textAlign: "center",
  },
  names: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  home: {
    minWidth: 98,
    alignItems: "center",
  },
  away: {
    minWidth: 98,
    alignItems: "center",
  },
  name: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  view: {
    width: "100%",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(108,108,113,0.35)",
    borderRadius: 34,
    marginTop: 30,
    marginBottom: 14,
  },
  map: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
    overflow: "hidden",
  },
  metaBlock: {
    paddingHorizontal: 16,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  metaTextRow: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  metaWhite: { color: "white", fontSize: 14, flexShrink: 1 },
  meta: {
    color: "#727272",
    fontSize: 14,
  },
});
