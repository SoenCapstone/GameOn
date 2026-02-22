import { useState, useLayoutEffect, useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

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
  const [sports, setSports] = useState<string[]>(["Basketball"]);

  const toggleSport = (sport: string) => {
    setSports((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport]
    );
  };

  const handleSave = useCallback(() => {
    // Replace this with your actual save logic (API call, store update, etc.)
    console.log("Saved sports:", sports);
    router.back(); // Optional: navigate back after saving
  }, [sports, router]);

  const headerTitle = useCallback(() => <RefereeSportsHeader onSave={handleSave} />, [
    handleSave,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle });
  }, [navigation, headerTitle]);

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
        {["Soccer", "Basketball", "Volleyball"].map((sport) => (
          <Form.Switch
            key={sport}
            label={sport}
            value={sports.includes(sport)}
            onValueChange={() => toggleSport(sport)}
          />
        ))}
      </Form.Section>
    </Form>
  </ContentArea>

  );
}
