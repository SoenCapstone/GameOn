import React from "react";
import { ContentArea } from "@/components/ui/content-area";
import { View } from "react-native";

export default function Spaces() {
  return (
    <ContentArea backgroundProps={{ preset: "purple" }}>
      <View />
    </ContentArea>
  );
}
