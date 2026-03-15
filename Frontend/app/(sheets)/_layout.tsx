import { Redirect, Slot } from "expo-router";
import { ClerkLoaded, SignedOut } from "@clerk/clerk-expo";
import { WELCOME_PATH } from "@/constants/navigation";
import React from "react";

export default function SheetsLayout() {
  return (
    <ClerkLoaded>
      <SignedOut>
        <Redirect href={WELCOME_PATH} />
      </SignedOut>
      <Slot />
    </ClerkLoaded>
  );
}
