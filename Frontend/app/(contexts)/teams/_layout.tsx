import React from "react";
import { Stack } from "expo-router";
import { useContextStackScreens } from "@/components/context-stack";

export default function TeamsLayout() {
  const screens = useContextStackScreens({
    create: { name: "create-team", title: "Create Team" },
    indexName: "[id]/index",
    extraScreens: [
      "[id]/settings/index",
      "[id]/manage-roles/index",
      "[id]/invite/index",
      "[id]/post/index",
    ],
  });

  return <Stack>{screens}</Stack>;
}
