import { Slot, Redirect } from "expo-router";
import { ClerkLoaded, SignedIn } from "@clerk/clerk-expo";
import { HOME_PATH } from "@/constants/navigation";

export default function AuthLayout() {
  return (
    <ClerkLoaded>
      <SignedIn>
        <Redirect href={HOME_PATH} />
      </SignedIn>
      <Slot />
    </ClerkLoaded>
  );
}
