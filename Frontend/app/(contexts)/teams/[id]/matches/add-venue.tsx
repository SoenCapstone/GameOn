import { RelativePathString, useLocalSearchParams } from "expo-router";
import { AddVenueScreen } from "@/components/matches/add-venue-screen";

export default function AddTeamVenueScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const teamId = params.id ?? "";
  return (
    <AddVenueScreen
      entityId={teamId}
      schedulePathname={
        `/teams/${teamId}/matches/schedule` as RelativePathString
      }
    />
  );
}
