import { router } from "expo-router";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { useRefereeSelection } from "@/hooks/use-referee-selection";
import { useReferee } from "@/contexts/referee-context";
import { ContentArea } from "@/components/ui/content-area";
import { createScopedLog } from "@/utils/logger";
import { FormToolbar } from "@/components/form/form-toolbar";

const SPORTS = ["Soccer", "Basketball", "Volleyball"];
const log = createScopedLog("Referee Sports Preferences");

export default function Sports() {
  const { sports, loading, saveSports } = useReferee();

  const { selectedItems, setSelectedItems, saveItems, saving, canSave } =
    useRefereeSelection({
      initialItems: sports,
      onSave: saveSports,
    });

  const handleSave = async () => {
    if (!canSave) {
      alert("Please select at least one sport");
      return;
    }

    try {
      await saveItems();
      router.back();
    } catch (error) {
      log.error("Failed to update sports:", error);
      alert("Failed to update sports");
    }
  };

  return (
    <ContentArea
      background={{ preset: "blue", mode: "form" }}
      toolbar={
        <FormToolbar
          title="Referee Sports"
          loading={saving}
          onSubmit={handleSave}
        />
      }
    >
      {!loading && (
        <Form accentColor={AccentColors.blue}>
          <Form.Section>
            <Form.Multiselect
              options={SPORTS}
              selected={selectedItems}
              onSelected={setSelectedItems}
            />
          </Form.Section>
        </Form>
      )}
    </ContentArea>
  );
}
