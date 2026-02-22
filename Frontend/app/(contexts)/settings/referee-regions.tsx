import { useState, useLayoutEffect, useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

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

  const [regions, setRegions] = useState<string[]>(["Montreal"]);

  const toggleRegion = (region: string) => {
    setRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };


  const handleSave = useCallback(() => {
    // Replace this with actual save logic (API call, store update, etc.)
    console.log("Saved regions:", regions);
    router.back(); 
  }, [regions, router]);

  // Inject header with Save button
  const headerTitle = useCallback(() => <RefereeRegionsHeader onSave={handleSave} />, [
    handleSave,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle });
  }, [navigation, headerTitle]);

  return (
    <ContentArea scrollable backgroundProps={{ preset: "orange", mode: "form" }}>
      <Form accentColor={AccentColors.orange}>
        <Form.Section header="Regions">
          {["Toronto", "Montreal", "Laval", "Vancouver"].map((region) => (
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