import { useEffect, useRef } from "react";
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
import { Alert } from "react-native";
import { useReferee } from "@/contexts/referee-context";

export default function Settings() {
  const { signOut } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const { flags, toggleFlag } = useFeatureFlags();
  const {
    isReferee,
    isActive,
    sports,
    regions,
    registerAsReferee,
    toggleRefereeStatus,
    refresh,
  } = useReferee();

  const isDev = (user?.publicMetadata as { isDev?: boolean })?.isDev === true;

  const logout = confirmLogout(signOut, log);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    refreshRef.current().catch((error) => {
      log.error("Failed to refresh referee data", error);
    });
  }, [isLoaded, isSignedIn]);

  if (!user || !isLoaded || !isSignedIn) return null;

  const confirmToggleReferee = () => {
    Alert.alert(
      isActive ? "Pause Refereeing?" : "Resume Refereeing?",
      isActive
        ? "You will no longer receive match assignments."
        : "You will start receiving match assignments again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: async () => {
            try {
              await toggleRefereeStatus();
            } catch {
              Alert.alert("Error", "Could not update referee status.");
            }
          },
        },
      ],
    );
  };

  return (
    <ContentArea scrollable backgroundProps={{ preset: "blue", mode: "form" }}>
      <Form accentColor={AccentColors.blue}>
        <Form.Section>
          <Form.Profile
            title={user.fullName!}
            subtitle={user.primaryEmailAddress?.emailAddress}
            image={
              user?.hasImage ? { uri: user.imageUrl } : images.defaultProfile
            }
            onPress={() => {
              router.push("/settings/profile/edit");
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
        {isReferee && (
          <Form.Section header="Referee Preferences">
            <Form.Link
              label="Sports"
              preview={sports}
              onPress={() => {
                router.push("/settings/referee/sports");
              }}
            />

            <Form.Link
              label="Regions"
              preview={regions}
              onPress={() => {
                router.push("/settings/referee/regions");
              }}
            />

            <Form.Button
              button={isActive ? "Pause Refereeing" : "Resume Refereeing"}
              onPress={confirmToggleReferee}
            />
          </Form.Section>
        )}
        <Form.Section>
          <Form.Link label="Terms and Privacy Policy" onPress={openPolicy} />
          {!isReferee && (
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
                      onPress: async () => {
                        try {
                          await registerAsReferee();
                          Alert.alert("Success", "You are now a referee!");
                        } catch {
                          Alert.alert(
                            "Error",
                            "Could not register as referee.",
                          );
                        }
                      },
                    },
                  ],
                );
              }}
            />
          )}
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
