import { useLayoutEffect, useCallback } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useRouter, useNavigation } from "expo-router";

interface RefereeSelectionPageProps {
  title: string;
  availableItems: string[];
  selectedItems: string[];
  toggleItem: (item: string) => void;
  saveItems: () => Promise<void>;
  canSave: boolean;
  loading: boolean;
}

export default function RefereeSelectionPage({
  title,
  availableItems,
  selectedItems,
  toggleItem,
  saveItems,
  canSave,
  loading,
}: RefereeSelectionPageProps) {
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
      console.error(`Failed to update ${title.toLowerCase()}:`, error);
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
        <Form.Section header={title}>
          {availableItems.map((item) => (
            <Form.Switch 
              key={item}
              label={item} 
              value={selectedItems.includes(item)} 
              onValueChange={() => toggleItem(item)} 
            />
          ))}
        </Form.Section>
      </Form>
    </ContentArea>
  );
}