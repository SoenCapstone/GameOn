import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-expo";

export default function HomeLayout() {
  const { user } = useUser();

  const renderHomeHeader = () => {
    return (
      <Header
        left={<Logo />}
        center={<PageTitle title="Home" />}
        right={
          <Button
            circle
            type="custom"
            route="/settings"
            icon="gear"
            image={user?.hasImage ? { uri: user.imageUrl } : undefined}
          />
        }
      />
    );
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: renderHomeHeader,
        }}
      />
    </Stack>
  );
}
