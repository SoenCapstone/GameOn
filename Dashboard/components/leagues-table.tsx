"use client";

import { useCallback, useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { CreateLeagueDialog } from "@/components/create-league-dialog";
import { LeagueRowActions } from "@/components/league-row-actions";
import { UsersPagination } from "@/components/users-pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DashboardLeague = {
  id: string;
  name: string;
  sport: string;
  slug: string;
  logoUrl: string | null;
  region: string | null;
  location: string | null;
  level: "RECREATIONAL" | "COMPETITIVE" | "YOUTH" | "AMATEUR" | "PROFESSIONAL" | null;
  privacy: "PUBLIC" | "PRIVATE";
  seasonCount: number;
  ownerUserId: string;
  createdAt: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imageUrl: string | null;
  };
};

type DashboardLeaguesResponse = {
  leagues: DashboardLeague[];
  total: number;
  limit: number;
  offset: number;
};

function getOwnerDisplayName(owner: DashboardLeague["owner"]) {
  const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  return owner.email ?? owner.id;
}

function getOwnerInitials(owner: DashboardLeague["owner"]) {
  const initials = [owner.firstName, owner.lastName]
    .filter(Boolean)
    .map((value) => value!.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  if (initials) {
    return initials;
  }

  return (owner.email ?? "U").charAt(0).toUpperCase();
}

function formatSport(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function LeaguesTable({
  initialData,
}: {
  initialData: DashboardLeaguesResponse;
}) {
  const [page, setPage] = useState(1);
  const pageSize = initialData.limit;
  const [leagues, setLeagues] = useState<DashboardLeague[]>(initialData.leagues);
  const [total, setTotal] = useState(initialData.total);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const loadLeagues = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: String(pageSize),
          offset: String((page - 1) * pageSize),
        });

        if (search) {
          params.set("search", search);
        }

        const response = await fetch(`/api/leagues?${params.toString()}`, {
          signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load leagues.");
        }

        const data = (await response.json()) as DashboardLeaguesResponse;
        const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

        if (page > totalPages) {
          setPage(totalPages);
          return;
        }

        setLeagues(data.leagues);
        setTotal(data.total);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }

        setError("Unable to load leagues right now.");
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [page, pageSize, search],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    void loadLeagues(controller.signal);

    return () => controller.abort();
  }, [loadLeagues, reloadToken]);

  return (
    <div className="flex flex-1 flex-col px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="relative max-w-sm flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search leagues"
            className="h-11 rounded-2xl border-white/10 bg-white/5 pl-11"
          />
        </div>
        <CreateLeagueDialog
          onCreated={() => {
            setPage(1);
            setReloadToken((current) => current + 1);
          }}
        />
      </div>
      <Card className="gap-3 border-white/10 bg-white/5 py-3 backdrop-blur-md">
        <CardContent className="px-6 py-0">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[14%]" />
              <col className="w-[24%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>League</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Privacy</TableHead>
                <TableHead>Id</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                    {error}
                  </TableCell>
                </TableRow>
              ) : isLoading && leagues.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={6} className="h-24">
                    <div className="text-muted-foreground flex items-center justify-center">
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        strokeWidth={2}
                        className="size-5 animate-spin"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leagues.map((league) => (
                    <TableRow key={league.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-none">
                            {league.logoUrl ? (
                              <img
                                src={league.logoUrl}
                                alt={league.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-muted-foreground text-xs font-medium">
                                {league.sport.slice(0, 3).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{league.name}</p>
                            <p className="text-muted-foreground truncate text-xs">
                              {league.region ?? league.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="block truncate">{formatSport(league.sport)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="lg">
                          <AvatarImage
                            src={league.owner.imageUrl ?? undefined}
                            alt={getOwnerDisplayName(league.owner)}
                          />
                          <AvatarFallback>{getOwnerInitials(league.owner)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {getOwnerDisplayName(league.owner)}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {league.owner.email ?? league.owner.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-white/10 bg-white/5 text-muted-foreground"
                      >
                        {league.privacy}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      <span className="block truncate">{league.id}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <LeagueRowActions
                        leagueId={league.id}
                        leagueName={league.name}
                        onDeleted={(deletedLeagueId) => {
                          setLeagues((currentLeagues) =>
                            currentLeagues.filter(
                              (currentLeague) => currentLeague.id !== deletedLeagueId,
                            ),
                          );
                          setTotal((currentTotal) => Math.max(0, currentTotal - 1));
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <UsersPagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
