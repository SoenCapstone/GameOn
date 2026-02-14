import React from "react";
import { Stack } from "expo-router";
import { useContextStackScreens } from "@/components/context-stack";

export default function TeamsLayout() {
  const screens = useContextStackScreens({
    create: { name: "create", title: "Create a Team" },
    indexName: "[id]/index",
    extraScreens: [
      "[id]/settings/index",
      "[id]/manage-roles/index",
      "[id]/invite/index",
    ],
  });

  return <Stack>{screens}</Stack>;
}
