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
import { useAxiosWithClerk, GO_REFEREE_SERVICE_ROUTES } from "@/hooks/use-axios-clerk";
import { useState, useEffect } from "react";
import { Alert } from "react-native";


export default function Settings() {
  const { signOut } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const { flags, toggleFlag } = useFeatureFlags();
  const [isReferee, setIsReferee] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const axios = useAxiosWithClerk();

  const isDev = (user?.publicMetadata as { isDev?: boolean })?.isDev === true;

  const logout = confirmLogout(signOut, log);

  useEffect(() => {
  const checkRefereeStatus = async () => {
    try {
      const response = await axios.get(
        GO_REFEREE_SERVICE_ROUTES.STATUS
      );

      setIsReferee(response.data.isReferee);
      setIsActive(response.data.isActive);
    } catch (error) {
      log.error("Error checking referee status:", error);
      setIsReferee(false);
    }
  };

  if (isLoaded && isSignedIn) {
    checkRefereeStatus();
  }
}, [isLoaded, isSignedIn, axios]);

  const registerAsReferee = async () => {
    try {
      await axios.post(GO_REFEREE_SERVICE_ROUTES.REGISTER, {
        sports: [""],
        allowedRegions: ["Montreal"],
        isActive: true,
      });

      setIsReferee(true);
      setIsActive(true);

      Alert.alert("Success", "You are now a referee!");
    } catch (error) {
      log.error("Error registering referee:", error);
      Alert.alert("Error", "Could not register as referee.");
    }
  };

  const toggleRefereeStatus = async () => {
    if (isActive === null) return;

    try {
      const newStatus = !isActive;

      await axios.put(GO_REFEREE_SERVICE_ROUTES.STATUS, {
        isActive: newStatus,
      });

      setIsActive(newStatus);

      Alert.alert(
        newStatus ? "Resumed" : "Paused",
        newStatus
          ? "You are now active as a referee."
          : "You are no longer accepting matches."
      );
    } catch (error) {
      log.error("Error updating referee status:", error);
      Alert.alert("Error", "Could not update referee status.");
    }
  };

  const [sports, setSports] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  useEffect(() => {
    if (!isReferee) return;

    const fetchProfile = async () => {
      try {
        const response = await axios.get(GO_REFEREE_SERVICE_ROUTES.PROFILE);

        setSports(response.data.sports || []);
        setRegions(response.data.allowedRegions || []);
      } catch (error) {
        console.error("Failed to load referee preferences:", error);
      }
    };

    fetchProfile();
  }, [axios, isReferee]);


  if (!user || !isLoaded || !isSignedIn) return null;

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
          {isReferee && (
              <Form.Section
                header="Referee Preferences"
              >
                <Form.Link
                  label="Sports"
                  preview= {sports}
                  onPress={() => {
                    router.push("/settings/referee-sports");}
                  }
                />

                <Form.Link
                  label="Regions"
                  preview = {regions}
                  onPress={() => {
                    router.push("/settings/referee-regions");}
                  }
                />

                <Form.Button
                  button={isActive ? "Pause Refereeing" : "Resume Refereeing"}
                  color={isActive ? AccentColors.red : undefined}
                  onPress={toggleRefereeStatus}
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
                        onPress: registerAsReferee,
                      },
                    ]
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
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
