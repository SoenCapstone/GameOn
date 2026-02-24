import RefereeSelectionPage from "@/components/referees/referee-selection-page";
import { useRefereeSelection } from "@/hooks/use-referee-selection";
import { GO_REFEREE_SERVICE_ROUTES } from "@/hooks/use-axios-clerk";

export default function RefereeRegions() {
  const { selectedItems, setSelectedItems, saveItems, loading, canSave } = useRefereeSelection({
    fetchRoute: GO_REFEREE_SERVICE_ROUTES.PROFILE,
    updateRoute: GO_REFEREE_SERVICE_ROUTES.UPDATE_REGIONS,
    fieldKey: "allowedRegions",
  });

  return <RefereeSelectionPage
    title="Regions"
    availableItems={["Toronto", "Montreal", "Laval", "Vancouver"]}
    selectedItems={selectedItems}
    setSelectedItems={setSelectedItems}
    saveItems={saveItems}
    canSave={canSave}
    loading={loading}
  />;
}