import React from "react";
import { Stack } from "expo-router";
import { useContextStackScreens } from "@/components/context-stack";

export default function MyLeaguesLayout() {
  const screens = useContextStackScreens({ indexName: "[id]/index" });
  return <Stack>{screens}</Stack>;
}
