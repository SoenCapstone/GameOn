import { useCallback, useLayoutEffect, useState } from "react";
import { RelativePathString, useNavigation, useRouter } from "expo-router";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { PROVINCE_OPTIONS } from "@/features/matches/utils";
import { Alert } from "react-native";

interface AddVenueScreenProps {
  readonly entityId: string;
  readonly schedulePathname: RelativePathString;
}

export function AddVenueScreen({
  entityId,
  schedulePathname,
}: Readonly<AddVenueScreenProps>) {
  const navigation = useNavigation();
  const router = useRouter();

  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState<
    (typeof PROVINCE_OPTIONS)[number] | undefined
  >(undefined);
  const [postalCode, setPostalCode] = useState("");

  const canSave = Boolean(
    name.trim() && street.trim() && city.trim() && postalCode.trim(),
  );

  const handleSave = useCallback(() => {
    if (!canSave) {
      Alert.alert("Invalid venue", "Please fill in all venue details.");
      return;
    }
    router.replace({
      pathname: schedulePathname,
      params: { id: entityId, newVenue: name.trim() },
    });
  }, [canSave, router, schedulePathname, entityId, name]);

  const renderAddVenueHeader = useCallback(() => {
    return (
      <Header
        left={<Button type="back" />}
        center={<PageTitle title="Add a Venue" />}
        right={
          <Button
            isInteractive
            type="custom"
            label="Add"
            onPress={handleSave}
          />
        }
      />
    );
  }, [handleSave]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: renderAddVenueHeader,
    });
  }, [navigation, renderAddVenueHeader]);

  return (
    <ContentArea background={{ preset: "red", mode: "form" }}>
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
