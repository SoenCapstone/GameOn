import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GO_USER_SERVICE_ROUTES, useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { RefereeProfile } from "@/features/matches/types";

export function useRefereeOptions(referees: RefereeProfile[] | undefined) {
  const api = useAxiosWithClerk();

  const refereeIds = useMemo(
    () => (referees ?? []).map((ref) => ref.userId),
    [referees],
  );

  const refereeNamesQuery = useQuery<Record<string, string>>({
    queryKey: ["referee-name-map", refereeIds.join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        refereeIds.map(async (userId) => {
          try {
            const resp = await api.get(GO_USER_SERVICE_ROUTES.BY_ID(userId));
            const first = resp.data?.firstname ?? "";
            const last = resp.data?.lastname ?? "";
            const fullName = `${first} ${last}`.trim();
            return [userId, fullName || userId] as const;
          } catch {
            return [userId, userId] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: refereeIds.length > 0,
    retry: false,
  });

  const labeledReferees = useMemo(() => {
    const labels = refereeIds.map((id) => refereeNamesQuery.data?.[id] ?? id);
    const counts = labels.reduce<Record<string, number>>((acc, label) => {
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {});

    return refereeIds.map((id, index) => {
      const baseLabel = labels[index];
      const label =
        counts[baseLabel] > 1 ? `${baseLabel} (${id.slice(0, 8)})` : baseLabel;
      return { id, label };
    });
  }, [refereeIds, refereeNamesQuery.data]);

  return useMemo(
    () => ({
      refereeOptions: labeledReferees.map((item) => item.label),
      refereeLabelToId: Object.fromEntries(labeledReferees.map((item) => [item.label, item.id])),
      refereeIdToLabel: Object.fromEntries(labeledReferees.map((item) => [item.id, item.label])),
    }),
    [labeledReferees],
  );
}
