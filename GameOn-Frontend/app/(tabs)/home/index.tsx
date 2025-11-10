import React from "react";
import { ContentArea } from "@/components/ui/content-area";
import { View } from "react-native";

export default function Home() {
  return (
    <ContentArea backgroundProps={{ preset: "blue" }}>
      <View />
    </ContentArea>
  );
}
