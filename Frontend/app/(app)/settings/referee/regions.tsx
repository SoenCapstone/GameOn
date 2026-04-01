import { router } from "expo-router";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { useRefereeSelection } from "@/hooks/use-referee-selection";
import { useReferee } from "@/contexts/referee-context";
import { ContentArea } from "@/components/ui/content-area";
import { createScopedLog } from "@/utils/logger";
import { FormToolbar } from "@/components/form/form-toolbar";

const REGIONS = ["Toronto", "Montreal", "Laval", "Vancouver"];

const log = createScopedLog("Referee Regions Preferences");

export default function Regions() {
  const { regions, loading, saveRegions } = useReferee();

  const { selectedItems, setSelectedItems, saveItems, saving, canSave } =
    useRefereeSelection({
      initialItems: regions,
      onSave: saveRegions,
    });

  const handleSave = async () => {
    if (!canSave) {
      alert("Please select at least one region");
      return;
    }

    try {
      await saveItems();
      router.back();
    } catch (error) {
      log.error("Failed to update regions:", error);
      alert("Failed to update regions");
    }
  };

  return (
    <ContentArea
      background={{ preset: "blue", mode: "form" }}
      toolbar={
        <FormToolbar
          title="Referee Regions"
          loading={saving}
          onSubmit={handleSave}
        />
      }
    >
      {!loading && (
        <Form accentColor={AccentColors.blue}>
          <Form.Section>
            <Form.Multiselect
              options={REGIONS}
              selected={selectedItems}
              onSelected={setSelectedItems}
            />
          </Form.Section>
        </Form>
      )}
    </ContentArea>
  );
}
