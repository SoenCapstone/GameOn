import React from "react";
import { Stack } from "expo-router";
import { useContextStackScreens } from "@/app/(contexts)/common/context-stack";

export default function MyTeamsLayout() {
  const screens = useContextStackScreens({ indexName: "[id]/index" });
  return <Stack>{screens}</Stack>;
}
