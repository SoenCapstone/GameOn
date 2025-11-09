import React from "react";
import ContentArea from "@/components/content-area";
import { Background } from "@/components/background";
import { useRouter } from "expo-router";
import { Text, Pressable } from "react-native";


export default function Teams() {

  const router = useRouter();

  return (
    <ContentArea>
      <Background preset="red" mode="default" />

      <Pressable onPress={() => router.push("/(contexts)/teams/createTeam")}>
        <Text>Create a Team</Text>
      </Pressable>
    </ContentArea>
  );
}
