import { useCallback, useLayoutEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { images } from "@/constants/images";
import { createScopedLog } from "@/utils/logger";
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
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { settingsStyles } from "@/constants/settings-styles";
import { useUpdateLeague } from "@/hooks/use-team-league-settings";
import {
  useAxiosWithClerk,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { pickImage } from "@/utils/pick-image";
import {
  isAllowedLogoMimeType,
  getLogoFileExtension,
} from "@/utils/logo-upload";

const log = createScopedLog("Edit League");

export default function EditLeagueScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";

  return (
    <LeagueDetailProvider id={id}>
      <EditLeagueContent />
    </LeagueDetailProvider>
  );
}

function EditLeagueContent() {
  const navigation = useNavigation();
  const router = useRouter();
  const api = useAxiosWithClerk();
  const {
    id,
    league,
    isLoading: leagueLoading,
    isOwner,
  } = useLeagueDetailContext();

  const [pickedLogo, setPickedLogo] = useState<{
    uri: string;
    mimeType: string;
  } | null>(null);
  const [logoUri, setLogoUri] = useState("");

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
  } = useLeagueForm({ initialData: league ?? undefined });

  useLayoutEffect(() => {
    setLogoUri(league?.logoUrl ?? "");
  }, [league?.logoUrl]);

  const updateLeagueMutation = useUpdateLeague(id, {
    onSuccess: () => {
      log.info("League updated successfully");
      router.back();
    },
    onError: (err) => {
      log.error("Update league failed", errorToString(err));
      Alert.alert("Update failed", errorToString(err));
    },
  });

  const hasChanges = league
    ? leagueName !== (league.name ?? "") ||
      selectedSport?.label?.toLowerCase() !== league.sport?.toLowerCase() ||
      selectedLevel?.id?.toLowerCase() !== league.level?.toLowerCase() ||
      region !== (league.region ?? "") ||
      location !== (league.location ?? "") ||
      logoUri !== (league.logoUrl ?? "") ||
      pickedLogo !== null
    : false;

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

  const handleRemoveLogo = useCallback(() => {
    setPickedLogo(null);
    setLogoUri("");
  }, []);

  const handleSave = useCallback(async () => {
    if (!leagueName.trim()) {
      Alert.alert("League update failed", "League name is required");
      return;
    }
    if (!selectedSport) {
      Alert.alert("League update failed", "Sport is required");
      return;
    }

    const basePayload = {
      name: leagueName.trim(),
      sport: selectedSport?.id ?? "",
      level: selectedLevel?.id ?? "",
      region: region.trim() || "",
      location: location.trim() || "",
      privacy: (league?.privacy ?? "PRIVATE") as "PUBLIC" | "PRIVATE",
    };

    if (pickedLogo) {
      const formData = new FormData();
      formData.append("file", {
        uri: pickedLogo.uri,
        type: pickedLogo.mimeType,
        name: `logo.${getLogoFileExtension(pickedLogo.mimeType)}`,
      } as unknown as Blob);
      try {
        const resp = await api.post(
          GO_LEAGUE_SERVICE_ROUTES.LEAGUE_LOGO(id),
          formData,
        );
        const newLogoUrl =
          (resp.data as { publicUrl?: string })?.publicUrl ?? "";
        updateLeagueMutation.mutate({
          ...basePayload,
          logoUrl: newLogoUrl || (logoUri ?? ""),
        });
      } catch (err) {
        log.error("Logo upload failed", errorToString(err));
        Alert.alert("Logo upload failed", errorToString(err));
      }
    } else {
      updateLeagueMutation.mutate({
        ...basePayload,
        logoUrl: logoUri ?? "",
      });
    }
  }, [
    leagueName,
    selectedSport,
    selectedLevel,
    region,
    location,
    logoUri,
    league?.privacy,
    pickedLogo,
    id,
    api,
    updateLeagueMutation,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title="Edit League" />}
          right={
            <Button
              type="custom"
              label="Save"
              onPress={handleSave}
              loading={updateLeagueMutation.isPending}
            />
          }
        />
      ),
    });
  }, [navigation, hasChanges, updateLeagueMutation.isPending, handleSave]);

  if (!isOwner) {
    return (
      <ContentArea backgroundProps={{ preset: "red" }}>
        <View style={settingsStyles.container}>
          <Text style={settingsStyles.errorText}>
            You don&apos;t have permission to edit this league
          </Text>
        </View>
      </ContentArea>
    );
  }

  if (!league) {
    return (
      <ContentArea backgroundProps={{ preset: "red" }}>
        <View style={settingsStyles.container}>
          <Text style={settingsStyles.errorText}>League not found</Text>
        </View>
      </ContentArea>
    );
  }

  return (
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
      {leagueLoading && (
        <View style={settingsStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <Form accentColor={AccentColors.red}>
        <Form.Section>
          <Form.Image
            logo
            image={
              pickedLogo
                ? { uri: pickedLogo.uri }
                : logoUri
                  ? { uri: logoUri }
                  : images.defaultLogo
            }
            onPress={handlePickLogo}
          />
          <Button
            type="custom"
            label="Remove logo"
            onPress={handleRemoveLogo}
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
            placeholder="e.g. Quebec"
            value={region}
            editable={false}
          />
          <Form.Menu
            label="Location"
            options={cityOptions}
            value={location || "Select location"}
            onValueChange={(label) => {
              if (label === "Select location") {
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
