import { useLayoutEffect, useState, useEffect } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation, StackActions } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { images } from "@/constants/images";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { settingsStyles } from "@/constants/settings-styles";
import { useDeleteTeam, useUpdateTeam } from "@/hooks/use-team-league-settings";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import { usePayment, type PaymentEntityType } from "@/hooks/use-payment";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { formatAmount } from "@/utils/payment";

const PUBLICATION_FEE_CENTS = 1500;

function TeamSettingsHeader() {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title="Team Settings" />}
    />
  );
}

export default function TeamSettingsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";

  return (
    <TeamDetailProvider id={id}>
      <TeamSettingsContent />
    </TeamDetailProvider>
  );
}

const log = createScopedLog("Team Settings");

function TeamSettingsContent() {
  const navigation = useNavigation();
  const router = useRouter();
  const api = useAxiosWithClerk();
  const { id, team, isLoading, isOwner } = useTeamDetailContext();

  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    setIsPublic((team?.privacy ?? "PRIVATE") === "PUBLIC");
  }, [team?.privacy]);

  const { runPayment, isPaying } = usePayment({
    api,
    entityType: "TEAM" as PaymentEntityType,
    entityId: id,
    amount: PUBLICATION_FEE_CENTS,
  });

  const updateTeamMutation = useUpdateTeam(id, {
    onSuccess: () => {
      log.info("Team updated successfully");
    },
    onError: (err) => {
      log.error("Update team failed", errorToString(err));
      Alert.alert("Update failed", errorToString(err));
    },
  });

  const deleteTeamMutation = useDeleteTeam(id, {
    onSuccess: () => {
      log.info("Team deleted successfully");
      navigation.dispatch(StackActions.pop(2));
      router.back();
    },
    onError: (err) => {
      log.error("Delete team failed", errorToString(err));
      Alert.alert("Delete failed", errorToString(err));
    },
  });

  const handleDeleteTeam = () => {
    Alert.alert(
      "Delete Team",
      "Are you sure you want to delete this team? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: () => deleteTeamMutation.mutate(),
          style: "destructive",
        },
      ],
    );
  };

  const handleRequestPurchase = () => {
    if (!team) return;
    const payload = {
      name: team.name ?? "",
      sport: team.sport ?? "",
      scope: team.scope ?? "",
      logoUrl: team.logoUrl ?? "",
      location: team.location ?? "",
      privacy: "PUBLIC" as const,
    };
    Alert.alert(
      "Team Publication Payment",
      `Amount: ${formatAmount(PUBLICATION_FEE_CENTS)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay & Continue",
          onPress: () =>
            runPayment(async () => {
              updateTeamMutation.mutate(payload);
              setIsPublic(true);
            }),
        },
      ],
    );
  };

  const handleSetPrivate = () => {
    if (!team) return;
    const payload = {
      name: team.name ?? "",
      sport: team.sport ?? "",
      scope: team.scope ?? "",
      logoUrl: team.logoUrl ?? "",
      location: team.location ?? "",
      privacy: "PRIVATE" as const,
    };
    updateTeamMutation.mutate(payload);
    setIsPublic(false);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: TeamSettingsHeader,
    });
  }, [navigation]);

  if (!team && !isLoading) {
    return (
      <ContentArea backgroundProps={{ preset: "red" }}>
        <View style={settingsStyles.container}>
          <Text style={settingsStyles.errorText}>Team not found</Text>
        </View>
      </ContentArea>
    );
  }

  if (!isOwner && team) {
    return (
      <ContentArea backgroundProps={{ preset: "red" }}>
        <View style={settingsStyles.container}>
          <Text style={settingsStyles.errorText}>
            You don&apos;t have permission to edit this team
          </Text>
        </View>
      </ContentArea>
    );
  }

  return (
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
      {isLoading && (
        <View style={settingsStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <Form accentColor={AccentColors.red}>
        <Form.Section>
          <Form.Profile
            title={team?.name ?? "Team"}
            subtitle={
              team?.sport
                ? `${team.sport.charAt(0).toUpperCase()}${team.sport.slice(1).toLowerCase()} Team`
                : "Team"
            }
            image={team?.logoUrl ? { uri: team.logoUrl } : images.defaultLogo}
            onPress={() => router.push(`/teams/${id}/settings/edit`)}
            logo
          />
        </Form.Section>

        <Form.Section
          header="Visibility"
          footer={
            isPublic
              ? "Private teams are not discoverable, cannot be followed by other users, and only members can see posts."
              : "Public teams are discoverable, can be followed by other users, and can make public posts."
          }
        >
          {isPublic ? (
            <Form.Button
              button="Switch to a Private Team"
              onPress={handleSetPrivate}
              disabled={updateTeamMutation.isPending}
            />
          ) : (
            <Form.Button
              button={isPaying ? "Processing…" : "Switch to a Public Team"}
              color={AccentColors.red}
              onPress={handleRequestPurchase}
              disabled={isPaying}
            />
          )}
        </Form.Section>

        <Form.Section>
          <Form.Button
            button={
              deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"
            }
            color={AccentColors.red}
            onPress={handleDeleteTeam}
            disabled={deleteTeamMutation.isPending}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
