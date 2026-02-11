import React, { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { TeamDetailHeader } from "@/components/teams/team-detail-header";
import { LeagueDetailHeader } from "@/components/leagues/league-detail-header";

interface UseTeamLeagueHeaderProps {
  title: string;
  id: string;
  isActiveMember: boolean;
  onFollow: () => void;
}

export function useTeamHeader({
  title,
  id,
  isActiveMember,
  onFollow,
}: UseTeamLeagueHeaderProps) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    function renderTeamHeader() {
      return (
        <TeamDetailHeader
          title={title}
          id={id}
          isActiveMember={isActiveMember}
          onFollow={onFollow}
        />
      );
    }

    navigation.setOptions({ headerTitle: renderTeamHeader });
  }, [navigation, title, id, isActiveMember, onFollow]);
}

export function useLeagueHeader({
  title,
  id,
  isActiveMember,
  onFollow,
}: UseTeamLeagueHeaderProps) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    function renderLeagueHeader() {
      return (
        <LeagueDetailHeader
          title={title}
          id={id}
          isActiveMember={isActiveMember}
          onFollow={onFollow}
        />
      );
    }

    navigation.setOptions({ headerTitle: renderLeagueHeader });
  }, [navigation, title, id, isActiveMember, onFollow]);
}
