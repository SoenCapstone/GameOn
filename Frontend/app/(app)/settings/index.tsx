import { useEffect, useRef } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { AccentColors } from "@/constants/colors";
import { Form } from "@/components/form/form";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { usePostHog } from "posthog-react-native";
import { router, Stack } from "expo-router";
import { useFeatureFlags } from "@/components/feature-flags/feature-flags-context";
import { confirmLogout } from "@/components/user-profile/profile-utils";
import { log } from "@/utils/logger";
import { openPolicy } from "@/components/privacy-disclaimer/utils";
import { images } from "@/constants/images";
import { Alert } from "react-native";
import { toast } from "@/utils/toast";
import { useReferee } from "@/contexts/referee-context";
import { useExplorePreferences } from "@/hooks/use-explore-preferences";
import {
  exploreSportOptions,
  exploreLocationOptions,
  exploreRangeOptions,
} from "@/constants/explore";

function SettingToolbar() {
  return <Stack.Screen.Title>Settings</Stack.Screen.Title>;
}

export default function Settings() {
  const { signOut } = useAuth();
  const posthog = usePostHog();
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

  const {
    preferences: explorePreferences,
    setSport: setExploreSport,
    setLocation: setExploreLocation,
    setRangeKm: setExploreRange,
  } = useExplorePreferences();

  const isDev = (user?.publicMetadata as { isDev?: boolean })?.isDev === true;

  const logout = confirmLogout(() => { posthog.reset(); return signOut(); }, log);

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
              toast.error("Error", {
                description: "Could not update referee status.",
              });
            }
          },
        },
      ],
    );
  };

  const confirmBecomeReferee = () => {
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
              toast.success("Success", {
                description: "You are now a referee!",
              });
            } catch {
              toast.error("Error", {
                description: "Could not register as referee.",
              });
            }
          },
        },
      ],
    );
  };

  return (
    <ContentArea
      background={{ preset: "blue", mode: "form" }}
      toolbar={<SettingToolbar />}
    >
      <Form accentColor={AccentColors.blue}>
        <Form.Section>
          <Form.Profile
            title={user.fullName ?? "User Name"}
            subtitle={user.primaryEmailAddress?.emailAddress}
            image={
              user?.hasImage ? { uri: user.imageUrl } : images.defaultProfile
            }
            onPress={() => {
              router.push("/settings/profile/edit");
            }}
          />
        </Form.Section>
        <Form.Section
          header="Explore Preferences"
          footer="Range determines the maximum distance to a game shown in the explore tab from the set location."
        >
          <Form.Menu
            label="Sport"
            placeholder="Select sport"
            options={exploreSportOptions}
            value={explorePreferences.sport}
            onValueChange={setExploreSport}
          />
          <Form.Menu
            label="Location"
            placeholder="Select location"
            options={exploreLocationOptions}
            value={explorePreferences.location}
            onValueChange={setExploreLocation}
          />
          <Form.Menu
            label="Range"
            placeholder="Select range"
            options={exploreRangeOptions.map((o) => o.label)}
            value={
              exploreRangeOptions.find(
                (o) => o.value === explorePreferences.rangeKm,
              )?.label
            }
            onValueChange={(label) => {
              const option = exploreRangeOptions.find((o) => o.label === label);
              if (option) setExploreRange(option.value);
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
              onPress={confirmBecomeReferee}
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
