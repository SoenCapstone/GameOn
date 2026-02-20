import React, { useLayoutEffect, useState, useEffect } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation, StackActions } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import { settingsStyles } from "@/constants/settings-styles";
import { usePayment, type PaymentEntityType } from "@/hooks/use-payment";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { formatAmount } from "@/utils/payment";
import { getSportLogo } from "@/components/browse/utils";
import {
  useUpdateLeague,
  useDeleteLeague,
} from "@/hooks/use-team-league-settings";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";

const log = createScopedLog("League Settings");
const PUBLICATION_FEE_CENTS = 1500;

export default function LeagueSettingsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";

  return (
    <LeagueDetailProvider id={id}>
      <LeagueSettingsContent />
    </LeagueDetailProvider>
  );
}

function LeagueSettingsContent() {
  const navigation = useNavigation();
  const router = useRouter();
  const api = useAxiosWithClerk();
  const {
    id,
    league,
    isLoading: leagueLoading,
    isOwner,
  } = useLeagueDetailContext();

  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    setIsPublic((league?.privacy ?? "PRIVATE") === "PUBLIC");
  }, [league?.privacy]);

  const { runPayment, isPaying } = usePayment({
    api,
    entityType: "LEAGUE" as PaymentEntityType,
    entityId: id,
    amount: PUBLICATION_FEE_CENTS,
  });

  const updateLeagueMutation = useUpdateLeague(id, {
    onSuccess: () => {
      log.info("League updated successfully");
    },
    onError: (err) => {
      log.error("Update league failed", errorToString(err));
      Alert.alert("Update failed", errorToString(err));
    },
  });

  const deleteLeagueMutation = useDeleteLeague(id, {
    onSuccess: () => {
      log.info("League deleted successfully");
      navigation.dispatch(StackActions.pop(2));
      router.back();
    },
    onError: (err) => {
      log.error("Delete league failed", errorToString(err));
      Alert.alert("Delete failed", errorToString(err));
    },
  });

  const handleRequestPurchase = () => {
    if (!league) return;
    const payload = {
      name: league.name ?? "",
      sport: league.sport ?? "",
      level: league.level ?? "",
      region: league.region ?? "",
      location: league.location ?? "",
      logoUrl: league.logoUrl ?? undefined,
      privacy: "PUBLIC" as const,
    };
    Alert.alert(
      "League Publication Payment",
      `Amount: ${formatAmount(PUBLICATION_FEE_CENTS)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay & Continue",
          onPress: () =>
            runPayment(async () => {
              updateLeagueMutation.mutate(payload);
              setIsPublic(true);
            }),
        },
      ],
    );
  };

  const handleSetPrivate = () => {
    if (!league) return;
    const payload = {
      name: league.name ?? "",
      sport: league.sport ?? "",
      level: league.level ?? "",
      region: league.region ?? "",
      location: league.location ?? "",
      logoUrl: league.logoUrl ?? undefined,
      privacy: "PRIVATE" as const,
    };
    updateLeagueMutation.mutate(payload);
    setIsPublic(false);
  };

  const handleDeleteLeague = () => {
    Alert.alert(
      "Delete League",
      "Are you sure you want to delete this league? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: () => deleteLeagueMutation.mutate(),
          style: "destructive",
        },
      ],
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title="League Settings" />}
        />
      ),
    });
  }, [navigation]);

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

  if (!league && !leagueLoading) {
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
          <Form.Profile
            title={league?.name ?? "League"}
            subtitle={
              league?.sport
                ? `${league.sport.charAt(0).toUpperCase()}${league.sport.slice(1).toLowerCase()} League`
                : "League"
            }
            image={
              league?.logoUrl
                ? { uri: league.logoUrl }
                : getSportLogo(league.sport)
            }
            onPress={() => router.push(`/leagues/${id}/settings/edit`)}
            logo
          />
        </Form.Section>

        <Form.Section
          header="Visibility"
          footer={
            isPublic
              ? "Private leagues are not discoverable, cannot be followed by other users, and only members can see posts."
              : "Public leagues are discoverable, can be followed by other users, and can make public posts."
          }
        >
          {isPublic ? (
            <Form.Button
              button="Switch to a Private League"
              color={AccentColors.red}
              onPress={handleSetPrivate}
              disabled={updateLeagueMutation.isPending}
            />
          ) : (
            <Form.Button
              button={isPaying ? "Processing…" : "Switch to a Public League"}
              color={AccentColors.red}
              onPress={handleRequestPurchase}
              disabled={isPaying}
            />
          )}
        </Form.Section>

        <Form.Section>
          <Form.Button
            button={
              deleteLeagueMutation.isPending ? "Deleting..." : "Delete League"
            }
            color={AccentColors.red}
            onPress={handleDeleteLeague}
            disabled={deleteLeagueMutation.isPending}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
