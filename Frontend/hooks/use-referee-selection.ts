import { useState, useEffect, useCallback } from "react";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";

interface UseRefereeSelectionParams {
  fetchRoute: string;
  updateRoute: string;
  fieldKey: string;
}

export function useRefereeSelection({ fetchRoute, updateRoute, fieldKey }: UseRefereeSelectionParams) {
  const axios = useAxiosWithClerk();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get(fetchRoute);
      setSelectedItems(prev => prev.length ? prev : response.data[fieldKey] || []);
    } catch (error) {
      console.error(`Failed to load ${fieldKey}:`, error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [axios, fetchRoute, fieldKey]);

  const toggleItem = useCallback((item: string) => {
  setSelectedItems((prev) =>
    prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
  );
}, []);

  const canSave = selectedItems.length > 0;

  const saveItems = useCallback(async () => {
    if (!canSave) {
      throw new Error(`Select at least one ${fieldKey}`);
    }
    await axios.put(updateRoute, { [fieldKey]: selectedItems });
  }, [axios, selectedItems, updateRoute, fieldKey, canSave]);

  return { selectedItems, toggleItem, saveItems, loading, canSave };
}