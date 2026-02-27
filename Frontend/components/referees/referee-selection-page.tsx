import { useLayoutEffect, useCallback } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useRouter, useNavigation } from "expo-router";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";

const log =createScopedLog("Referee Selection Page");

interface RefereeSelectionPageProps {
  readonly title: string;
  readonly availableItems: readonly string[];
  readonly selectedItems: readonly string[];
  readonly setSelectedItems: (items: string[]) => void;
  readonly saveItems: () => Promise<void>;
  readonly canSave: boolean;
  readonly loading: boolean;
}

export default function RefereeSelectionPage(
  props: Readonly<RefereeSelectionPageProps>
  ) {
    const {
      title,
      availableItems,
      selectedItems,
      setSelectedItems,
      saveItems,
      canSave,
      loading,
    } = props;
  const router = useRouter();
  const navigation = useNavigation();

  const handleSave = useCallback(async () => {
    if (!canSave) {
      alert(`Please select at least one ${title.toLowerCase()}`);
      return;
    }
    try {
      await saveItems();
      router.back();
    } catch (error) {
      log.error(`Failed to update ${title.toLowerCase()}:`, errorToString(error));
      alert(`Failed to update ${title.toLowerCase()}`);
    }
  }, [canSave, saveItems, router, title]);

  const headerTitle = useCallback(
    () => <Header left={<Button type="back" />} center={<PageTitle title={title} />} right={<Button type="custom" label="Save" onPress={handleSave} />} />,
    [handleSave, title]
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle });
  }, [navigation, headerTitle]);

  if (loading) return null;

  return (
    <ContentArea scrollable backgroundProps={{ preset: "orange", mode: "form" }}>
      <Form accentColor={AccentColors.orange}>
        <Form.Section>
          <Form.Multiselect
            options={availableItems}
            selected={selectedItems}
            onSelected={setSelectedItems}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}