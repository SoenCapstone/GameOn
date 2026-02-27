import { useState, useCallback } from "react";

interface UseRefereeSelectionParams {
  initialItems: string[];
  onSave: (items: string[]) => Promise<void>;
}

export function useRefereeSelection({
  initialItems,
  onSave,
}: UseRefereeSelectionParams) {
  const [selectedItems, setSelectedItems] = useState<string[]>(initialItems);
  const [saving, setSaving] = useState(false);

  const canSave = selectedItems.length > 0;

  const saveItems = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(selectedItems);
    } finally {
      setSaving(false);
    }
  }, [onSave, selectedItems]);

  return { selectedItems, setSelectedItems, saveItems, saving, canSave };
}