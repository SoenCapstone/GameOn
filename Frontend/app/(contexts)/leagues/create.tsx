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
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";
import { useLeagueForm } from "@/hooks/use-league-form";
import {
  sportOptions,
  levelOptions,
  cityOptions,
  getSportByLabel,
  getLevelByLabel,
  getCityByLabel,
} from "@/constants/form-constants";
import { pickImage } from "@/utils/pick-image";
import {
  isAllowedLogoMimeType,
  getLogoFileExtension,
} from "@/utils/logo-upload";

const log = createScopedLog("Create League Page");

export default function CreateLeagueScreen() {
  const router = useRouter();
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

  const [pickedLogo, setPickedLogo] = useState<{
    uri: string;
    mimeType: string;
  } | null>(null);

  const {
    leagueName,
    setLeagueName,
    selectedSport,
    setSelectedSport,
    selectedLevel,
    setSelectedLevel,
    region,
    location,
    setLocation,
  } = useLeagueForm({ initialData: { region: "Canada" } });

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

  const createLeagueMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: leagueName.trim(),
        sport: selectedSport?.id ?? "",
        region: region.trim() || undefined,
        location: location.trim() || undefined,
        level: selectedLevel?.id ?? undefined,
        privacy: "PRIVATE" as const,
      };

      log.info("Sending league creation payload:", payload);
      const resp = await api.post(GO_LEAGUE_SERVICE_ROUTES.CREATE, payload);
      const data = resp.data as { id: string; slug: string };

      if (pickedLogo && data.id) {
        const formData = new FormData();
        formData.append("file", {
          uri: pickedLogo.uri,
          type: pickedLogo.mimeType,
          name: `logo.${getLogoFileExtension(pickedLogo.mimeType)}`,
        } as unknown as Blob);
        await api.post(GO_LEAGUE_SERVICE_ROUTES.LEAGUE_LOGO(data.id), formData);
        log.info("League logo uploaded for league", data.id);
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leagues"] });
      Alert.alert(
        "League created",
        "Your league has been created successfully.",
      );
      router.back();
    },
    onError: (err) => {
      const message = errorToString(err);
      log.error("Create league failed", message);
      Alert.alert("League creation failed", message);
    },
  });

  const handleCreateLeague = useCallback(() => {
    if (!leagueName.trim()) {
      Alert.alert("League creation failed", "League name is required");
      return;
    }
    if (!selectedSport) {
      Alert.alert("League creation failed", "Sport is required");
      return;
    }
    createLeagueMutation.mutate();
  }, [leagueName, selectedSport, createLeagueMutation]);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title="Create a League" />}
          right={
            <Button
              type="custom"
              label={createLeagueMutation.isPending ? "Creating..." : "Create"}
              onPress={handleCreateLeague}
              loading={createLeagueMutation.isPending}
            />
          }
        />
      ),
    });
  }, [navigation, createLeagueMutation.isPending, handleCreateLeague]);

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
            placeholder="Enter league name"
            value={leagueName}
            onChangeText={setLeagueName}
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
            label="Level"
            options={levelOptions}
            value={selectedLevel?.label ?? "Optional"}
            onValueChange={(label) => {
              if (label === "Optional") {
                setSelectedLevel(null);
              } else {
                const o = getLevelByLabel(label);
                if (o) setSelectedLevel(o);
              }
            }}
          />
          <Form.Input
            label="Region"
            placeholder="Enter region"
            value={region}
            editable={false}
          />
          <Form.Menu
            label="Location"
            options={cityOptions}
            value={location || "City"}
            onValueChange={(label) => {
              if (label === "City") {
                setLocation("");
              } else {
                const o = getCityByLabel(label);
                if (o) setLocation(o.label);
              }
            }}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
