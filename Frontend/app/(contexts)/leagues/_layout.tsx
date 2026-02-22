import React from "react";
import { Stack } from "expo-router";
import { useContextStackScreens } from "@/components/context-stack";

export default function LeaguesLayout() {
  const screens = useContextStackScreens({
    create: { name: "create", title: "Create a League" },
    indexName: "[id]/index",
    extraScreens: [
      "[id]/settings/index",
      "[id]/settings/edit",
      "[id]/manage/index",
      "[id]/invite/index",
      "[id]/matches/schedule",
      "[id]/matches/add-venue",
      "[id]/matches/[matchId]",
    ],
  });

  return <Stack>{screens}</Stack>;
}
