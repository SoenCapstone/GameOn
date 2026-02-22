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
import { useState } from "react";
import { Alert } from "react-native";


export default function Settings() {
  const { signOut } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const { flags, toggleFlag } = useFeatureFlags();
  const [isReferee, setIsReferee] = useState(false);

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
            title={user.fullName!}
            subtitle={user.primaryEmailAddress?.emailAddress}
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
          <Form.Section
            header="Referee"
            footer="Referees help keep games fair and running smoothly."
          >
          {!isReferee ? (
            <Form.Button
              button="Become a Referee"
              onPress={() => {
                Alert.alert(
                  "Become a Referee?",
                  "Referees help keep games fair and running smoothly.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Continue",
                      onPress: () => setIsReferee(true),
                    },
                  ]
                );
              }}
            />
          ) : (
            <>
              <Form.Button
                button="Sports"
                onPress={() => {
                  router.push("/settings/referee-sports");}
                }
              />

              <Form.Button
                button="Regions"
                onPress={() => {
                  router.push("/settings/referee-regions");}
                }
              />
            

              <Form.Button
                button="Pause Refereeing"
                color={AccentColors.red}
                onPress={() => setIsReferee(false)}
              />
            </>
          )}
          </Form.Section>

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
