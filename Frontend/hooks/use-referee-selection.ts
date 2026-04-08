import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

interface UseRefereeSelectionParams {
  initialItems: string[];
  onSave: (items: string[]) => Promise<void>;
}

export function useRefereeSelection({
  initialItems,
  onSave,
}: UseRefereeSelectionParams) {
  const [selectedItems, setSelectedItems] = useState<string[]>(initialItems);
  const saveMutation = useMutation({
    mutationFn: async () => {
      await onSave(selectedItems);
    },
  });

  const canSave = selectedItems.length > 0;

  const saveItems = () => saveMutation.mutateAsync();

  return {
    selectedItems,
    setSelectedItems,
    saveItems,
    saving: saveMutation.isPending,
    canSave,
  };
}
