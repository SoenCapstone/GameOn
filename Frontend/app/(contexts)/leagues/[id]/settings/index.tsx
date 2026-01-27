import React, { useLayoutEffect } from "react";
import {
  View,
  ActivityIndicator,
  Pressable,
  Text,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation, StackActions } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import PickerModal from "@/components/ui/pickerModal";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import { useLeagueForm } from "@/hooks/use-league-form";
import { getLeaguePickerConfig } from "@/components/leagues/league-form-constants";
import { LeagueNameField } from "@/components/leagues/league-name-field";
import { LeagueDetailsCard } from "@/components/leagues/league-details-card";
import { useUpdateLeague, useDeleteLeague } from "@/hooks/use-team-league-settings";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { settingsStyles } from "@/constants/settings-styles";
import PublicPaymentModal from "@/components/payments/public-payment-modal";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { LeagueVisibilityControl } from "@/components/leagues/league-visibility-control";

const log = createScopedLog("League Settings");
const PUBLICATION_FEE_CENTS = 1500;

function SettingsHeader({
  onSave,
  isSaveEnabled,
  isSaving,
}: {
  readonly onSave: () => void;
  readonly isSaveEnabled: boolean;
  readonly isSaving: boolean;
}) {
  const isDisabled = !isSaveEnabled || isSaving;

  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title="League Settings" />}
      right={
        <Pressable
          onPress={() => !isDisabled && onSave()}
          disabled={isDisabled}
          style={{
            backgroundColor: isSaveEnabled && !isSaving ? "#0052ff" : "#cccccc",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      }
    />
  );
}

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
  const { id, league, isLoading: leagueLoading, isOwner } =
    useLeagueDetailContext();

  const [paymentVisible, setPaymentVisible] = React.useState(false);
  const [pendingPayload, setPendingPayload] = React.useState<any | null>(null);

  const [hasPublicAccessLocal, setHasPublicAccessLocal] = React.useState(false);

  React.useEffect(() => {
    const purchased = (league?.privacy ?? "PRIVATE") === "PUBLIC";
    setHasPublicAccessLocal(purchased);
  }, [league?.privacy]);

  const {
    leagueName,
    setLeagueName,
    selectedSport,
    setSelectedSport,
    selectedLevel,
    setSelectedLevel,
    region,
    setRegion,
    location,
    setLocation,
    isPublic,
    setIsPublic,
    openPicker,
    setOpenPicker,
  } = useLeagueForm({
    initialData: league ?? undefined,
  });

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

  const sportLabel = selectedSport?.label ?? "None";
  const levelLabel = selectedLevel?.label ?? "Optional";

  const hasChanges = league
    ? leagueName !== (league.name ?? "") ||
      selectedSport?.label?.toLowerCase() !== league.sport?.toLowerCase() ||
      selectedLevel?.id?.toLowerCase() !== league.level?.toLowerCase() ||
      region !== (league.region ?? "") ||
      location !== (league.location ?? "") ||
      isPublic !== (league.privacy === "PUBLIC")
    : false;

  const pickerConfig = getLeaguePickerConfig(setSelectedSport, setSelectedLevel);
  const currentConfig = openPicker ? pickerConfig[openPicker] : undefined;

  useLayoutEffect(() => {
    const renderHeader = () => {
      const handleUpdateLeague = () => {
        if (!leagueName.trim()) {
          Alert.alert("League update failed", "League name is required");
          return;
        }

        const payload = {
          name: leagueName.trim(),
          sport: selectedSport?.id ?? "",
          level: selectedLevel?.id ?? "",
          region: region.trim() || "",
          location: location.trim() || "",
          privacy: isPublic ? "PUBLIC" : "PRIVATE",
        } as const;

        const wasPublic = (league?.privacy ?? "PRIVATE") === "PUBLIC";
        const wantsPublic = payload.privacy === "PUBLIC";

        if (!wasPublic && wantsPublic) {
          setPendingPayload(payload);
          setPaymentVisible(true);
          return;
        }

        updateLeagueMutation.mutate(payload);
      };

      return (
        <SettingsHeader
          onSave={handleUpdateLeague}
          isSaveEnabled={hasChanges}
          isSaving={updateLeagueMutation.isPending}
        />
      );
    };

    navigation.setOptions({
      headerTitle: renderHeader,
    });
  }, [
    navigation,
    hasChanges,
    updateLeagueMutation.isPending,
    updateLeagueMutation,
    league,
    leagueName,
    selectedSport,
    selectedLevel,
    region,
    location,
    isPublic,
  ]);

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

      <LeagueNameField
        leagueName={leagueName}
        onChangeLeagueName={setLeagueName}
      />

      <LeagueDetailsCard
        sportLabel={sportLabel}
        levelLabel={levelLabel}
        region={region}
        location={location}
        onChangeRegion={setRegion}
        onChangeLocation={setLocation}
        onOpenPicker={setOpenPicker}
      />

      <LeagueVisibilityControl
        isPublic={isPublic}
        hasPublicAccess={hasPublicAccessLocal}
        onRequestPurchase={() => {
          if (!leagueName.trim()) {
            Alert.alert("League update failed", "League name is required");
            return;
          }

          const payload = {
            name: leagueName.trim(),
            sport: selectedSport?.id ?? "",
            level: selectedLevel?.id ?? "",
            region: region.trim() || "",
            location: location.trim() || "",
            privacy: "PUBLIC",
          } as const;

          setPendingPayload(payload);
          setPaymentVisible(true);
        }}
        onChangePublic={setIsPublic}
      />

      <Pressable
        style={[
          settingsStyles.deleteButton,
          deleteLeagueMutation.isPending && settingsStyles.deleteButtonDisabled,
        ]}
        onPress={() => {
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
        }}
        disabled={deleteLeagueMutation.isPending}
      >
        <Text style={settingsStyles.deleteButtonText}>
          {deleteLeagueMutation.isPending ? "Deleting..." : "Delete League"}
        </Text>
      </Pressable>

      <PickerModal
        visible={openPicker !== null}
        title={currentConfig?.title ?? ""}
        options={currentConfig?.options ?? []}
        onClose={() => setOpenPicker(null)}
        onSelect={(option) => {
          if (!openPicker) return;
          pickerConfig[openPicker].setter(option);
          setOpenPicker(null);
        }}
      />

      <PublicPaymentModal
        visible={paymentVisible}
        onClose={() => {
          setPaymentVisible(false);
          setPendingPayload(null);
        }}
        api={api as any}
        entityType="LEAGUE"
        entityId={id}
        amount={PUBLICATION_FEE_CENTS}
        onPaidSuccess={async () => {
          if (!pendingPayload) return;

          updateLeagueMutation.mutate(pendingPayload);

          setHasPublicAccessLocal(true);
          setIsPublic(true);

          setPendingPayload(null);
          setPaymentVisible(false);
        }}
      />
    </ContentArea>
  );
}
