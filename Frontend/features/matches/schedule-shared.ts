import { Venue } from "@/features/matches/types";

export type VenueOption = {
  id: string;
  label: string;
};

export function buildVenueOptions(venues: Venue[] | undefined): VenueOption[] {
  return (venues ?? []).map((venue) => ({
    id: venue.id,
    label: `${venue.name} - ${venue.city}`,
  }));
}

export function buildVenueOptionMaps(options: VenueOption[]) {
  return {
    venueLabelToId: Object.fromEntries(
      options.map((venue) => [venue.label, venue.id]),
    ) as Record<string, string>,
    venueIdToLabel: Object.fromEntries(
      options.map((venue) => [venue.id, venue.label]),
    ) as Record<string, string>,
  };
}

export function resolveSelectedVenueLabel(
  venueId: string,
  venueIdToLabel: Record<string, string>,
  newVenueName?: string,
) {
  return (
    (venueId ? venueIdToLabel[venueId] : undefined) ??
    (newVenueName ? `${newVenueName} - New` : "")
  );
}

export function parseDraftDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}
