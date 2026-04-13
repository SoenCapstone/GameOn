import { useFeatureFlag } from "posthog-react-native";

/**
 * PostHog-backed feature flags for gating key user actions.
 * Flags default to enabled (true) when not configured in PostHog.
 *
 * PostHog flag keys:
 *   create-team, create-league, schedule-match, add-venue, submit-score, create-post
 */
export function usePostHogFlags() {
  const createTeam = useFeatureFlag("create-team");
  const createLeague = useFeatureFlag("create-league");
  const scheduleMatch = useFeatureFlag("schedule-match");
  const addVenue = useFeatureFlag("add-venue");
  const submitScore = useFeatureFlag("submit-score");
  const createPost = useFeatureFlag("create-post");

  return {
    canCreateTeam: createTeam !== false,
    canCreateLeague: createLeague !== false,
    canScheduleMatch: scheduleMatch !== false,
    canAddVenue: addVenue !== false,
    canSubmitScore: submitScore !== false,
    canCreatePost: createPost !== false,
  };
}
