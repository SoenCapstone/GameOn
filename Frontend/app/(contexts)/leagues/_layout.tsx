import React from "react";
import { Stack } from "expo-router";
import { useContextStackScreens } from "@/components/context-stack";

export default function LeaguesLayout() {
  const screens = useContextStackScreens({
    create: { name: "create", title: "Create a League" },
    indexName: "[id]/index",
    extraScreens: [
      "[id]/settings/index",
      "[id]/manage/index",
      "[id]/invite/index",
    ],
  });

  return <Stack>{screens}</Stack>;
}
