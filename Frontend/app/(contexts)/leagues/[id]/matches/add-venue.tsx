import { useLocalSearchParams } from "expo-router";
import { AddVenueScreen } from "@/components/matches/add-venue-screen";

export default function AddLeagueVenueScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const leagueId = params.id ?? "";
  return <AddVenueScreen entityId={leagueId} schedulePathname="/leagues/[id]/matches/schedule" />;
}
