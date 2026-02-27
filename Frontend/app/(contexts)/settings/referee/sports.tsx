import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { useRefereeSelection } from "@/hooks/use-referee-selection";
import { useRefereeHeader } from "@/hooks/use-referee-header";
import { useReferee } from "@/contexts/referee-context";
import { ContentArea } from "@/components/ui/content-area";

const SPORTS = ["Soccer", "Basketball", "Volleyball"];

export default function Sports() {
  const { sports, loading, saveSports } = useReferee();

  const { selectedItems, setSelectedItems, saveItems, saving, canSave } =
    useRefereeSelection({
      initialItems: sports,
      onSave: saveSports,
    });

  useRefereeHeader({ title: "Sports", canSave, saving, saveItems });

  return (
    <ContentArea scrollable backgroundProps={{ preset: "blue", mode: "form" }}>
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

