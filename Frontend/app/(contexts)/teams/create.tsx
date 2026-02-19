import { useCallback, useLayoutEffect, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { images } from "@/constants/images";
import { createScopedLog } from "@/utils/logger";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";
import { useTeamForm } from "@/hooks/use-team-form";
import {
  sportOptions,
  scopeOptions,
  cityOptions,
  getSportByLabel,
  getScopeByLabel,
  getCityByLabel,
} from "@/constants/form-constants";
import { pickImage } from "@/utils/pick-image";
import {
  isAllowedLogoMimeType,
  getLogoFileExtension,
} from "@/utils/logo-upload";

const log = createScopedLog("Create Team Page");

export default function CreateTeamScreen() {
  const router = useRouter();
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

  const [pickedLogo, setPickedLogo] = useState<{
    uri: string;
    mimeType: string;
  } | null>(null);

  const {
    teamName,
    setTeamName,
    selectedSport,
    setSelectedSport,
    selectedScope,
    setSelectedScope,
    selectedCity,
    setSelectedCity,
  } = useTeamForm();

  const handlePickLogo = useCallback(async () => {
    await pickImage((img) => {
      if (!isAllowedLogoMimeType(img.mimeType)) {
        Alert.alert(
          "Unsupported format",
          "Only images with transparent background are supported for logos.",
        );
        return;
      }
      setPickedLogo({
        uri: img.uri,
        mimeType: (img.mimeType ?? "image/png").toLowerCase().trim(),
      });
    });
  }, []);

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: teamName.trim(),
        sport: selectedSport?.id ?? "",
        scope: selectedScope?.id ?? "",
        location: selectedCity?.label ?? "",
        privacy: "PRIVATE",
      };
      log.info("Sending team creation payload:", payload);
      const resp = await api.post(GO_TEAM_SERVICE_ROUTES.CREATE, payload);
      const data = resp.data as { id: string; slug: string };

      if (pickedLogo && data.id) {
        const formData = new FormData();
        formData.append("file", {
          uri: pickedLogo.uri,
          type: pickedLogo.mimeType,
          name: `logo.${getLogoFileExtension(pickedLogo.mimeType)}`,
        } as unknown as Blob);
        await api.post(GO_TEAM_SERVICE_ROUTES.TEAM_LOGO(data.id), formData);
        log.info("Team logo uploaded for team", data.id);
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
      Alert.alert("Team created", "Your team has been created.");
      router.back();
    },
    onError: (err) => {
      const message = errorToString(err);
      log.error("Create team failed", message);
      Alert.alert("Team creation failed", message);
    },
  });

  const handleCreateTeam = useCallback(() => {
    if (!teamName.trim()) {
      Alert.alert("Team creation failed", "Team name is required");
      return;
    }
    if (!selectedSport) {
      Alert.alert("Team creation failed", "Sport is required");
      return;
    }
    if (!selectedCity) {
      Alert.alert("Team creation failed", "City is required");
      return;
    }
    createTeamMutation.mutate();
  }, [teamName, selectedSport, selectedCity, createTeamMutation]);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title="Create a Team" />}
          right={
            <Button
              type="custom"
              label={createTeamMutation.isPending ? "Creating..." : "Create"}
              onPress={handleCreateTeam}
              loading={createTeamMutation.isPending}
            />
          }
        />
      ),
    });
  }, [navigation, createTeamMutation.isPending, handleCreateTeam]);

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "purple", mode: "form" }}
    >
      <Form accentColor={AccentColors.purple}>
        <Form.Section>
          <Form.Image
            logo
            image={pickedLogo ? { uri: pickedLogo.uri } : images.defaultLogo}
            onPress={handlePickLogo}
          />
          <Button
            type="custom"
            label="Remove logo"
            onPress={() => setPickedLogo(null)}
          />
        </Form.Section>

        <Form.Section footer="Only images with transparent background are supported.">
          <Form.Input
            label="Name"
            placeholder="Enter team name"
            value={teamName}
            onChangeText={setTeamName}
          />
          <Form.Menu
            label="Sport"
            options={sportOptions}
            value={selectedSport?.label ?? "None"}
            onValueChange={(label) => {
              if (label === "None") {
                setSelectedSport(null);
              } else {
                const o = getSportByLabel(label);
                if (o) setSelectedSport(o);
              }
            }}
          />
          <Form.Menu
            label="Scope"
            options={scopeOptions}
            value={selectedScope.label}
            onValueChange={(label) => {
              const o = getScopeByLabel(label);
              if (o) setSelectedScope(o);
            }}
          />
          <Form.Menu
            label="Location"
            options={cityOptions}
            value={selectedCity?.label ?? "City"}
            onValueChange={(label) => {
              if (label === "Select location") {
                setSelectedCity(null);
              } else {
                const o = getCityByLabel(label);
                if (o) setSelectedCity(o);
              }
            }}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
