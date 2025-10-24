import React from "react";
import { ContentArea } from "@/components/content-area";
import { Background } from "@/components/background";

export default function Home() {
  return (
    <ContentArea>
      <Background preset="blue" mode="default" />
    </ContentArea>
  );
}
