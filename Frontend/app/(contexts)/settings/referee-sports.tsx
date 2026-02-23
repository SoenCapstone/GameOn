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

function RefereeSportsHeader({ onSave }: { onSave: () => void }) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title="Referee Sports" />}
      right={<Button type="custom" label="Save" onPress={onSave} />}
    />
  );
}

export default function RefereeSports() {
  const router = useRouter();
  const navigation = useNavigation();
  const axios = useAxiosWithClerk();

  const [sports, setSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const availableSports = ["Soccer", "Basketball", "Volleyball"];

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await axios.get(
          GO_REFEREE_SERVICE_ROUTES.PROFILE
        );

        setSports(response.data.sports || []);
      } catch (error) {
        console.error("Failed to load sports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSports();
  }, []);

  const toggleSport = useCallback(
  (sport: string) => {
    setSports((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport]
    );
  },
  [setSports]
);

  const handleSave = useCallback(async () => {
    try {
      await axios.put(GO_REFEREE_SERVICE_ROUTES.UPDATE_SPORTS, {
        sports,
      });

      router.back();
    } catch (error) {
      console.error("Failed to update sports:", error);
    }
  }, [sports, axios, router]);

  const canSave = sports.length > 0;

  const headerTitle = useCallback(
    () => (
      <RefereeSportsHeader
        onSave={() => {
          if (!canSave) {
            Alert.alert(
              "Cannot Save",
              "Please select at least one sport."
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
        <Form.Section
          header="Sports"
          footer="Select the sports you referee for."
        >
          {availableSports.map((sport) => (
            <Form.Switch
              key={sport}
              label={sport}
              value={!!sports.includes(sport)}
              onValueChange={() => toggleSport(sport)}
            />
          ))}
        </Form.Section>
      </Form>
    </ContentArea>
  );
}