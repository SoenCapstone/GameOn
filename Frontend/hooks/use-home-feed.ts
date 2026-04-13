import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import type { AxiosInstance } from "axios";
import { createScopedLog } from "@/utils/logger";
import { fetchMyTeams } from "@/hooks/messages/api";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { fetchUserNameMap } from "@/utils/board";
import type { LeagueListResponse } from "@/types/leagues";
import type { HomeFeedItem } from "@/types/feed";
import { dedupeHomeFeedItems, sortHomeFeedItems } from "@/utils/feed";
import { toast } from "@/utils/toast";
import { errorToString } from "@/utils/error";
import {
  buildHomeItems,
  collectFeedMatchTeamIds,
  collectFeedPostAuthorIds,
  fetchLeagueSummaryMap,
  fetchFeedBuckets,
  fetchTeamSummaryMap,
  normalizeTeamSpace,
} from "@/utils/home";

const log = createScopedLog("HomeFeed");

async function fetchMyLeagueIds(api: AxiosInstance) {
  try {
    const response = await api.get<LeagueListResponse>(
      GO_LEAGUE_SERVICE_ROUTES.ALL,
      {
        params: { my: true },
      },
    );

    return (response.data.items ?? []).map((league) => league.id);
  } catch (error) {
    log.warn("Failed to fetch user league memberships for home feed", error);
    return [];
  }
}

export function useHomeFeed() {
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  return useQuery<HomeFeedItem[]>({
    queryKey: ["home-feed", userId],
    enabled: Boolean(userId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      try {
        log.info("Fetching home feed", { userId });

        const teams = await fetchMyTeams(api);
        const myLeagueIds = await fetchMyLeagueIds(api);

        const teamSpaces = teams.map(normalizeTeamSpace);
        const leagueIdsFromTeams = [
          ...new Set(
            teams
              .map((team) => team.leagueId)
              .filter((leagueId): leagueId is string => Boolean(leagueId)),
          ),
        ];
        const leagueIds = [...new Set([...leagueIdsFromTeams, ...myLeagueIds])];

        if (teamSpaces.length === 0 && leagueIds.length === 0) {
          log.info("Home feed empty because user has no teams or leagues", {
            userId,
          });
          return [];
        }

        log.info("Resolved home feed scope", {
          userId,
          teamCount: teamSpaces.length,
          teamLeagueCount: leagueIdsFromTeams.length,
          memberLeagueCount: myLeagueIds.length,
          leagueCount: leagueIds.length,
        });

        const {
          teamPostBuckets,
          teamMatchBuckets,
          leaguePostBuckets,
          leagueMatchBuckets,
        } = await fetchFeedBuckets({
          api,
          teamSpaces,
          leagueIds,
          onlyEveryonePosts: false,
          label: "feed",
          log,
        });

        const postAuthorIds = collectFeedPostAuthorIds({
          teamPostBuckets,
          leaguePostBuckets,
        });

        const userNameMap = await fetchUserNameMap(api, postAuthorIds, log);

        const leagueSummaryMap = await fetchLeagueSummaryMap(
          api,
          leagueIds,
          log,
        );

        const allMatchTeamIds = collectFeedMatchTeamIds({
          teamMatchBuckets,
          leagueMatchBuckets,
        });

        const teamSummaryMap = await fetchTeamSummaryMap(
          api,
          teams,
          allMatchTeamIds,
          log,
        );

        const feedItems: HomeFeedItem[] = buildHomeItems({
          teamPostBuckets,
          leaguePostBuckets,
          teamMatchBuckets,
          leagueMatchBuckets,
          userNameMap,
          leagueSummaryMap,
          teamSummaryMap,
        });

        const feed = sortHomeFeedItems(dedupeHomeFeedItems(feedItems));

        log.info("Home feed assembled", {
          userId,
          itemCount: feed.length,
          postCount: feed.filter((item) => item.kind === "post").length,
          matchCount: feed.filter((item) => item.kind === "match").length,
        });

        return feed;
      } catch (error) {
        log.error("Failed to fetch home feed", { userId, error });
        toast.error("Failed to Load Feed", {
          description: errorToString(error),
        });
        throw error;
      }
    },
  });
}
