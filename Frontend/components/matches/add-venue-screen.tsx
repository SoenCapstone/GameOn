import { useCallback, useState } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { PROVINCE_OPTIONS } from "@/features/matches/utils";
import { useCreateLeagueVenue, useCreateTeamVenue } from "@/hooks/use-matches";
import { errorToString } from "@/utils/error";
import { FormToolbar } from "@/components/form/form-toolbar";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

interface AddVenueScreenProps {
  readonly entityId: string;
  readonly schedulePathname: RelativePathString;
  readonly contextType: "team" | "league";
}

function buildFormattedAddress(input: {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}) {
  return `${input.street}, ${input.city}, ${input.province}, ${input.postalCode}, ${input.country}`;
}

export function AddVenueScreen({
  entityId,
  schedulePathname,
  contextType,
}: Readonly<AddVenueScreenProps>) {
  const params = useLocalSearchParams<{
    id?: string;
    homeTeamId?: string;
    awayTeamId?: string;
    draftHomeTeamId?: string;
    draftAwayTeamId?: string;
    draftDate?: string;
    draftStartTime?: string;
    draftEndTime?: string;
    draftVenueId?: string;
    draftRequiresReferee?: string;
    draftRefereeUserId?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const createTeamVenue = useCreateTeamVenue();
  const createLeagueVenue = useCreateLeagueVenue();
  const isSaving = createTeamVenue.isPending || createLeagueVenue.isPending;

  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState<
    (typeof PROVINCE_OPTIONS)[number] | undefined
  >(undefined);
  const [postalCode, setPostalCode] = useState("");

  const country = "Canada";

  const canSave = Boolean(
    name.trim() &&
      street.trim() &&
      city.trim() &&
      province?.trim() &&
      postalCode.trim(),
  );

  const geocodeAddress = useCallback(
    async (
      address: string,
    ): Promise<{ latitude: number; longitude: number }> => {
      if (typeof Location.geocodeAsync !== "function") {
        throw new TypeError(
          "Expo geocoding is unavailable. Install expo-location.",
        );
      }

      const geocodeResults = await Location.geocodeAsync(address);
      if (!Array.isArray(geocodeResults) || geocodeResults.length === 0) {
        throw new TypeError(
          "We couldn't find this address. Please verify the venue address.",
        );
      }

      const firstResult = geocodeResults[0];
      if (
        typeof firstResult?.latitude !== "number" ||
        typeof firstResult?.longitude !== "number"
      ) {
        throw new TypeError(
          "We couldn't find this address. Please verify the venue address.",
        );
      }

      return {
        latitude: firstResult.latitude,
        longitude: firstResult.longitude,
      };
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!canSave) {
      Alert.alert(
        "Invalid venue",
        "Please fill in all required venue details.",
      );
      return;
    }

    const payloadAddress = {
      street: street.trim(),
      city: city.trim(),
      province: province!.trim(),
      postalCode: postalCode.trim(),
      country,
    };

    const formattedAddress = buildFormattedAddress(payloadAddress);

    let latitude: number;
    let longitude: number;
    try {
      const coords = await geocodeAddress(formattedAddress);
      latitude = coords.latitude;
      longitude = coords.longitude;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't find this address. Please verify the venue address.";
      Alert.alert("Address not found", message);
      return;
    }

    const payload = {
      name: name.trim(),
      ...payloadAddress,
      region: city.trim(),
      latitude,
      longitude,
      homeTeamId: params.homeTeamId?.trim() || undefined,
      awayTeamId: params.awayTeamId?.trim() || undefined,
    };

    try {
      const venue =
        contextType === "team"
          ? await createTeamVenue.mutateAsync(payload)
          : await createLeagueVenue.mutateAsync(payload);

      await queryClient.invalidateQueries({ queryKey: ["team-venues"] });
      await queryClient.invalidateQueries({ queryKey: ["league-venues"] });

      router.dismissTo({
        pathname: schedulePathname,
        params: {
          id: entityId,
          newVenueId: venue.id,
          newVenueName: venue.name,
          homeTeamId: params.homeTeamId,
          awayTeamId: params.awayTeamId,
          draftHomeTeamId: params.draftHomeTeamId,
          draftAwayTeamId: params.draftAwayTeamId,
          draftDate: params.draftDate,
          draftStartTime: params.draftStartTime,
          draftEndTime: params.draftEndTime,
          draftVenueId: params.draftVenueId,
          draftRequiresReferee: params.draftRequiresReferee,
          draftRefereeUserId: params.draftRefereeUserId,
        },
      });
    } catch (err) {
      const message =
        String(errorToString(err) ?? "Could not create venue.") ||
        "Could not create venue.";
      Alert.alert("Add venue failed", message);
    }
  }, [
    canSave,
    city,
    contextType,
    country,
    createLeagueVenue,
    createTeamVenue,
    entityId,
    geocodeAddress,
    name,
    params.awayTeamId,
    params.draftAwayTeamId,
    params.draftDate,
    params.draftEndTime,
    params.draftHomeTeamId,
    params.draftRefereeUserId,
    params.draftRequiresReferee,
    params.draftStartTime,
    params.draftVenueId,
    params.homeTeamId,
    postalCode,
    province,
    queryClient,
    router,
    schedulePathname,
    street,
  ]);

  return (
    <ContentArea
      background={{ preset: "red", mode: "form" }}
      toolbar={
        <FormToolbar
          title="Add a Venue"
          onSubmit={handleSave}
          loading={isSaving}
        />
      }
    >
      <Form accentColor={AccentColors.red}>
        <Form.Section>
          <Form.Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Venue name"
          />
        </Form.Section>

        <Form.Section header="Address">
          <Form.Input
            label="Street"
            value={street}
            onChangeText={setStreet}
            placeholder="Street"
          />
          <Form.Input
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="City"
          />
          <Form.Menu
            label="Province"
            placeholder="Select province"
            options={[...PROVINCE_OPTIONS]}
            value={province}
            onValueChange={(value) =>
              setProvince(value as (typeof PROVINCE_OPTIONS)[number])
            }
          />
          <Form.Input
            label="Postal code"
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="Postal code"
            autoCapitalize="characters"
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
