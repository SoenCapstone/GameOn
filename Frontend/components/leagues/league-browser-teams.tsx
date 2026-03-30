import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { InfoCard } from "@/components/info-card";
import type { ImageSource } from "expo-image";
import { getSportLogo } from "@/utils/search";
import type { TeamSummary } from "@/types/matches";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";

export type LeagueTeamResponse = {
  id: string;
  leagueId: string;
  teamId: string;
  joinedAt: string;
};

type Props = Readonly<{
  leagueTeams: LeagueTeamResponse[];
  teamsFetching: boolean;
  leagueTeamsError: unknown;
  teamDetailsMap?: Record<string, TeamSummary>;
  detailsFetching: boolean;
  detailsError: unknown;
}>;

export function LeagueBrowserTeams({
  leagueTeams,
  teamsFetching,
  leagueTeamsError,
  teamDetailsMap,
  detailsFetching,
  detailsError,
}: Props) {
  const router = useRouter();

  const isLoading = teamsFetching || detailsFetching;

  if (leagueTeamsError || detailsError) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Teams</Text>
        <Text style={styles.text}>Failed to load league teams.</Text>
      </View>
    );
  }

  if (!isLoading && leagueTeams.length === 0) {
    return <Empty message="No teams in this league" />;
  }

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <View style={styles.list}>
          {leagueTeams.map((t) => {
            const details = teamDetailsMap?.[t.teamId];
            const title = details?.name ?? "Team";

            const location = details?.location ?? "";
            const subtitle =
              location.trim().length > 0 ? location : "Unknown location";

            const image: ImageSource = details?.logoUrl
              ? { uri: details.logoUrl }
              : getSportLogo(details?.sport);

            return (
              <InfoCard
                key={t.id}
                title={title}
                subtitle={subtitle}
                image={image}
                onPress={() => router.push(`/teams/${t.teamId}`)}
              />
            );
          })}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 14,
    paddingBottom: 14,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  text: {
    color: "#fff",
    fontSize: 14,
  },
  list: {
    gap: 14,
  },
});
