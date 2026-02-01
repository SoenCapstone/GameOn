import React, { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { TeamDetailHeader } from "@/components/teams/team-detail-header";
import { LeagueDetailHeader } from "@/components/leagues/league-detail-header";

interface UseTeamLeagueHeaderProps {
  title: string;
  id: string;
  isOwner: boolean;
  isMember: boolean;
  onFollow: () => void;
}

export function useTeamHeader({
  title,
  id,
  isOwner,
  isMember,
  onFollow,
}: UseTeamLeagueHeaderProps) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    function renderTeamHeader() {
      return (
        <TeamDetailHeader
          title={title}
          id={id}
          isOwner={isOwner}
          isMember={isMember}
          onFollow={onFollow}
        />
      );
    }

    navigation.setOptions({ headerTitle: renderTeamHeader });
  }, [navigation, title, id, isOwner, isMember, onFollow]);
}

export function useLeagueHeader({
  title,
  id,
  isOwner,
  isMember,
  onFollow,
}: UseTeamLeagueHeaderProps) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    function renderLeagueHeader() {
      return (
        <LeagueDetailHeader
          title={title}
          id={id}
          isOwner={isOwner}
          isMember={isMember}
          onFollow={onFollow}
        />
      );
    }

    navigation.setOptions({ headerTitle: renderLeagueHeader });
  }, [navigation, title, id, isOwner, isMember, onFollow]);
}
