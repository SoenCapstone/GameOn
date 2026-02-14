import { ContentArea } from "@/components/ui/content-area";
import { AccentColors } from "@/constants/colors";
import { Form } from "@/components/form/form";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useFeatureFlags } from "@/components/feature-flags/feature-flags-context";
import { confirmLogout } from "@/components/user-profile/profile-utils";
import { log } from "@/utils/logger";
import { openPolicy } from "@/components/privacy-disclaimer/utils";
import { images } from "@/constants/images";

export default function Settings() {
  const { signOut } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const { flags, toggleFlag } = useFeatureFlags();

  const isDev = (user?.publicMetadata as { isDev?: boolean })?.isDev === true;

  const logout = confirmLogout(signOut, log);

  if (!user || !isLoaded || !isSignedIn) return null;

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "orange", mode: "form" }}
    >
      <Form accentColor={AccentColors.orange}>
        <Form.Section>
          <Form.Profile
            name={user.fullName!}
            email={user.primaryEmailAddress?.emailAddress}
            image={
              user?.hasImage ? { uri: user.imageUrl } : images.defaultProfile
            }
            onPress={() => {
              router.push("/settings/edit-profile");
            }}
          />
        </Form.Section>
        {isDev && (
          <Form.Section
            header="Feature Flags"
            footer="Toggle experimental features for testing."
          >
            {Object.entries(flags).map(([key, value]) => (
              <Form.Switch
                key={key}
                label={key}
                value={value}
                onValueChange={() => toggleFlag(key as keyof typeof flags)}
              />
            ))}
          </Form.Section>
        )}
        <Form.Section>
          {isDev && (
            <Form.Link
              label="Site Map"
              onPress={() => router.push("/_sitemap")}
            />
          )}
          <Form.Link label="Terms and Privacy Policy" onPress={openPolicy} />
          <Form.Button
            button="Sign Out"
            color={AccentColors.red}
            onPress={() => logout()}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
