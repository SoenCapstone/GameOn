import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { useRefereeSelection } from "@/hooks/use-referee-selection";
import { useRefereeHeader } from "@/hooks/use-referee-header";
import { useReferee } from "@/contexts/referee-context";
import { ContentArea } from "@/components/ui/content-area";

const REGIONS = ["Toronto", "Montreal", "Laval", "Vancouver"];

export default function Regions() {
  const { regions, loading, saveRegions } = useReferee();

  const { selectedItems, setSelectedItems, saveItems, saving, canSave } =
    useRefereeSelection({
      initialItems: regions,
      onSave: saveRegions,
    });

  useRefereeHeader({ title: "Regions", canSave, saving, saveItems });

  return (
    <ContentArea scrollable backgroundProps={{ preset: "blue", mode: "form" }}>
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
