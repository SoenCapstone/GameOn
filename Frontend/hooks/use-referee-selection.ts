import { useState, useEffect, useCallback } from "react";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";

interface UseRefereeSelectionParams {
  fetchRoute: string;
  updateRoute: string;
  fieldKey: string;
}

const log = createScopedLog("Use Referee Selection");

export function useRefereeSelection({ fetchRoute, updateRoute, fieldKey }: UseRefereeSelectionParams) {
  const axios = useAxiosWithClerk();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get(fetchRoute);
      if (!initialized) {
          setSelectedItems(response.data[fieldKey] || []);
          setInitialized(true);
        }
    } catch (error) {
      log.error(`Failed to load ${fieldKey}:`, errorToString(error));
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [axios, fetchRoute, fieldKey, initialized]);


  const canSave = selectedItems.length > 0;

  const saveItems = useCallback(async () => {
    if (!canSave) {
      throw new Error(`Select at least one ${fieldKey}`);
    }
    await axios.put(updateRoute, { [fieldKey]: selectedItems });
  }, [axios, selectedItems, updateRoute, fieldKey, canSave]);

  return { selectedItems, setSelectedItems, saveItems, loading, canSave };
}