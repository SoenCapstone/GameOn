import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { Logo } from "@/components/header/logo";
import { ContentArea } from "@/components/ui/content-area";
import { Empty } from "@/components/ui/empty";

function HomeToolbar() {
  const { user } = useUser();

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <Logo />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Screen.Title>Home</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => router.push("/notifications")}>
          <Stack.Toolbar.Icon sf="bell.fill" />
        </Stack.Toolbar.Button>
        {user?.hasImage ? (
          <Stack.Toolbar.View>
            <Pressable onPress={() => router.push("/settings")}>
              <Image
                source={{ uri: user.imageUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            </Pressable>
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button
            icon="gear"
            onPress={() => router.push("/settings")}
          />
        )}
      </Stack.Toolbar>
    </>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"feed" | "following">("feed");

  return (
    <ContentArea
      tabs={{
        values: ["Feed", "Following"],
        selectedIndex: tab === "feed" ? 0 : 1,
        onValueChange: (value) => {
          if (value === "Feed") setTab("feed");
          if (value === "Following") setTab("following");
        },
      }}
      toolbar={<HomeToolbar />}
      background={{ preset: "blue" }}
    >
      <Empty message="No updates available" />
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 100,
  },
});
