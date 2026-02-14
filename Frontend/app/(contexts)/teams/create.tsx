import React, { useCallback, useLayoutEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
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
  SPORTS,
  SCOPE_OPTIONS,
  CITIES,
} from "@/components/teams/team-form-constants";

const log = createScopedLog("Create Team Page");

const sportOptions = [...SPORTS.map((o) => o.label)];
const scopeOptions = SCOPE_OPTIONS.map((o) => o.label);
const cityOptions = [...CITIES.map((o) => o.label)];

export default function CreateTeamScreen() {
  const router = useRouter();
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

  const {
    teamName,
    setTeamName,
    selectedSport,
    setSelectedSport,
    selectedScope,
    setSelectedScope,
    selectedCity,
    setSelectedCity,
    logoUri,
    setLogoUri,
  } = useTeamForm();

  const handlePickLogo = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "We need access to your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setLogoUri(result.assets[0].uri);
    }
  }, [setLogoUri]);

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: teamName.trim(),
        sport: selectedSport?.id ?? "",
        scope: selectedScope?.id ?? "",
        logoUrl: logoUri ?? "",
        location: selectedCity?.label ?? "",
        privacy: "PRIVATE",
      };
      log.info("Sending team creation payload:", payload);
      const resp = await api.post(GO_TEAM_SERVICE_ROUTES.CREATE, payload);
      return resp.data as { id: string; slug: string };
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
  }, [
    teamName,
    selectedSport,
    selectedCity,
    createTeamMutation,
  ]);

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
  }, [
    navigation,
    createTeamMutation.isPending,
    handleCreateTeam,
  ]);

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "purple", mode: "form" }}
    >
      <Form accentColor={AccentColors.purple}>
        <Form.Section>
          <Form.Image
            image={logoUri ? { uri: logoUri } : images.defaultLogo}
            onPress={handlePickLogo}
          />
          <Button
            type="custom"
            label="Remove logo"
            onPress={() => setLogoUri(null)}
          />
        </Form.Section>

        <Form.Section>
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
                const o = SPORTS.find((x) => x.label === label);
                if (o) setSelectedSport(o);
              }
            }}
          />
          <Form.Menu
            label="Scope"
            options={scopeOptions}
            value={selectedScope.label}
            onValueChange={(label) => {
              const o = SCOPE_OPTIONS.find((x) => x.label === label);
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
                const o = CITIES.find((x) => x.label === label);
                if (o) setSelectedCity(o);
              }
            }}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
