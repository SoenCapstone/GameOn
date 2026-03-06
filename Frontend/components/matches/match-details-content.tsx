import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { getSportLogo } from "@/components/browse/utils";
import { formatMatchDateTime, toBadgeStatus } from "@/features/matches/utils";
import MapView from "react-native-maps";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface MatchDetailsContentProps {
  readonly startTime: string;
  readonly status: string;
  readonly homeTeamName: string;
  readonly awayTeamName: string;
  readonly homeTeamLogoUrl?: string | null;
  readonly awayTeamLogoUrl?: string | null;
  readonly sport?: string | null;
  readonly contextLabel: string;
  readonly refereeName?: string;
  readonly venueName?: string | null;
  readonly canCancel: boolean;
  readonly onConfirmCancel: () => Promise<void>;
}

const statusColors: Record<string, string> = {
  PENDING: "rgba(240,174,46,0.9)",
  CONFIRMED: "rgba(35,166,85,0.95)",
  CANCELLED: "rgba(189,44,44,0.95)",
  COMPLETED: "rgba(44,106,189,0.95)",
};

export function MatchDetailsContent({
  startTime,
  status,
  homeTeamName,
  awayTeamName,
  homeTeamLogoUrl,
  awayTeamLogoUrl,
  sport,
  contextLabel,
  refereeName,
  venueName,
  canCancel,
  onConfirmCancel,
}: Readonly<MatchDetailsContentProps>) {
  const badgeStatus = toBadgeStatus(status);
  const centerValue =
    status === "CANCELLED" ? "Cancelled" : formatMatchDateTime(startTime);

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
              {centerValue ? (
                <Text
                  style={status === "CANCELLED" ? styles.pending : styles.date}
                >
                  {centerValue}
                </Text>
              ) : null}
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
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          />
        </View>

        <View style={styles.metaBlock}>
          {/*<View*/}
          {/*  style={[*/}
          {/*    styles.badge,*/}
          {/*    {*/}
          {/*      backgroundColor:*/}
          {/*        statusColors[badgeStatus] ?? "rgba(44,106,189,0.95)",*/}
          {/*    },*/}
          {/*  ]}*/}
          {/*>*/}
          {/*  <Text style={styles.badgeText}>{badgeStatus}</Text>*/}
          {/*</View>*/}
          {venueName ? (
            <View style={styles.venue}>
              <IconSymbol name="mappin.and.ellipse" color="727272" size={18} />
              <View style={{ flexDirection: "row", gap: 4 }}>
                <Text style={styles.meta}>Venue:</Text>
                <Text style={styles.metaWhite}>{venueName}</Text>
              </View>
            </View>
          ) : null}
          {refereeName ? (
            <View style={styles.referee}>
              <IconSymbol name="flag.fill" color="727272" size={15} />
              <View style={{ flexDirection: "row", gap: 4 }}>
                <Text style={styles.meta}>Referee:</Text>
                <Text style={styles.metaWhite}>{refereeName}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {/*{canCancel ? (*/}
      {/*  <Pressable*/}
      {/*    style={styles.cancelButton}*/}
      {/*    onPress={() => {*/}
      {/*      Alert.alert(*/}
      {/*        "Cancel match",*/}
      {/*        "Are you sure you want to cancel this match?",*/}
      {/*        [*/}
      {/*          { text: "Keep", style: "cancel" },*/}
      {/*          {*/}
      {/*            text: "Cancel Match",*/}
      {/*            style: "destructive",*/}
      {/*            onPress: () => {*/}
      {/*              void onConfirmCancel();*/}
      {/*            },*/}
      {/*          },*/}
      {/*        ],*/}
      {/*      );*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    <Text style={styles.cancelText}>Cancel Match</Text>*/}
      {/*  </Pressable>*/}
      {/*) : null}*/}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 44,
    paddingBottom: 32,
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
    height: 238,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(108,108,113,0.35)",
    borderRadius: 34,
    marginTop: 38,
    marginBottom: 18,
  },
  map: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
  },
  metaBlock: {
    paddingHorizontal: 16,
    gap: 8,
  },
  venue: {
    flexDirection: "row",
    gap: 8,
  },
  referee: {
    flexDirection: "row",
    gap: 8,
  },
  metaWhite: { color: "white", fontSize: 14 },
  meta: {
    color: "#727272",
    fontSize: 14,
  },
  cancelButton: {
    borderRadius: 999,
    backgroundColor: "rgba(255,0,0,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  cancelText: {
    color: "#ffb3b3",
    fontWeight: "700",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
