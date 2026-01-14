import React, { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { TeamDetailHeader } from "@/components/teams/team-detail-header";

interface UseTeamHeaderProps {
  title: string;
  id: string;
  isOwner: boolean;
  onFollow: () => void;
}

export function useTeamHeader({
  title,
  id,
  isOwner,
  onFollow,
}: UseTeamHeaderProps) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    function renderTeamHeader() {
      return (
        <TeamDetailHeader
          title={title}
          id={id}
          isOwner={isOwner}
          onFollow={onFollow}
        />
      );
    }

    navigation.setOptions({ headerTitle: renderTeamHeader });
  }, [navigation, title, id, isOwner, onFollow]);
}
