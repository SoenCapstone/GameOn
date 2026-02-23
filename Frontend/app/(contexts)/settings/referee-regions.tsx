import { useState, useLayoutEffect, useCallback, useEffect } from "react";
import { useNavigation, useRouter } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useAxiosWithClerk, GO_REFEREE_SERVICE_ROUTES } from "@/hooks/use-axios-clerk";
import { Alert } from "react-native";

function RefereeRegionsHeader({ onSave }: { onSave: () => void }) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title="Referee Regions" />}
      right={<Button type="custom" label="Save" onPress={onSave} />}
    />
  );
}

export default function RefereeRegions() {
  const router = useRouter();
  const navigation = useNavigation();
  const axios = useAxiosWithClerk();

  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const availableRegions = ["Toronto", "Montreal", "Laval", "Vancouver"];


  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await axios.get(
          GO_REFEREE_SERVICE_ROUTES.PROFILE
        );

        setRegions(response.data.allowedRegions || []);
      } catch (error) {
        console.error("Failed to load regions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, []); 

  const toggleRegion = useCallback((region: string) => {
    setRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await axios.put(GO_REFEREE_SERVICE_ROUTES.UPDATE_REGIONS, {
        allowedRegions: regions,
      });

      router.back();
    } catch (error) {
      console.error("Failed to update regions:", error);
    }
  }, [regions, axios, router]);

  const canSave = regions.length > 0;

  const headerTitle = useCallback(
  () => (
    <RefereeRegionsHeader
      onSave={() => {
        if (!canSave) {
          Alert.alert(
            "Cannot Save",
            "Please select at least one region."
          );
          return;
        }
        handleSave();
      }}
    />
  ),
  [handleSave, canSave]
);

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle });
  }, [navigation, headerTitle]);

  if (loading) return null;

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "orange", mode: "form" }}
    >
      <Form accentColor={AccentColors.orange}>
        <Form.Section header="Regions">
          {availableRegions.map((region) => (
            <Form.Switch
              key={region}
              label={region}
              value={regions.includes(region)}
              onValueChange={() => toggleRegion(region)}
            />
          ))}
        </Form.Section>
      </Form>
    </ContentArea>
  );
}