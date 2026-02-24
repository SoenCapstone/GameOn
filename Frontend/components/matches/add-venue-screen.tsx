import { useLayoutEffect, useState } from "react";
import { useNavigation, useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { PROVINCE_OPTIONS } from "@/features/matches/utils";

interface AddVenueScreenProps {
  readonly entityId: string;
  readonly schedulePathname: "/leagues/[id]/matches/schedule" | "/teams/[id]/matches/schedule";
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
  const [province, setProvince] = useState<(typeof PROVINCE_OPTIONS)[number]>(
    PROVINCE_OPTIONS[0],
  );
  const [postalCode, setPostalCode] = useState("");

  const canSave = Boolean(name.trim() && street.trim() && city.trim() && postalCode.trim());
  const handleSave = () => {
    if (!canSave) return;
    router.replace({
      pathname: schedulePathname,
      params: { id: entityId, newVenue: name.trim() },
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Add a Venue",
    });
  }, [navigation]);

  return (
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
      <Form accentColor={AccentColors.red}>
        <Form.Section>
          <Form.Input label="Name" value={name} onChangeText={setName} placeholder="Venue name" />
          <Form.Input label="Street" value={street} onChangeText={setStreet} placeholder="Street" />
          <Form.Input label="City" value={city} onChangeText={setCity} placeholder="City" />
          <Form.Menu
            label="Province"
            options={[...PROVINCE_OPTIONS]}
            value={province}
            onValueChange={(value) => setProvince(value as (typeof PROVINCE_OPTIONS)[number])}
          />
          <Form.Input
            label="Postal code"
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="Postal code"
            autoCapitalize="characters"
          />
        </Form.Section>
        <Form.Section>
          <Button type="custom" label="Save" isInteractive={canSave} onPress={handleSave} />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
