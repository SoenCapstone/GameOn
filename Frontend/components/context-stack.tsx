import React from "react";
import { Stack } from "expo-router";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

interface ContextStackConfig {
  readonly create?: { name: string; title: string };
  readonly indexName: string;
  readonly extraScreens?: string[];
}

const transparentOptions = {
  headerTransparent: true,
  headerShadowVisible: false,
};

const backlessOptions = {
  ...transparentOptions,
  headerBackVisible: false,
};

function buildCreateHeader(title: string) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title={title} />}
    />
  );
}

export function useContextStackScreens({
  create,
  indexName,
  extraScreens = [],
}: Readonly<ContextStackConfig>) {
  return [
    create && (
      <Stack.Screen
        key={create.name}
        name={create.name}
        options={{
          ...transparentOptions,
          headerTitle: () => buildCreateHeader(create.title),
        }}
      />
    ),
    <Stack.Screen key={indexName} name={indexName} options={backlessOptions} />,
    ...extraScreens.map((name) => (
      <Stack.Screen key={name} name={name} options={backlessOptions} />
    )),
  ].filter(Boolean);
}
