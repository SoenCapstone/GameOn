"use client";

import { useCallback, useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { CreateUserDialog } from "@/components/create-user-sheet";
import { UserRowActions } from "@/components/user-row-actions";
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

type DashboardUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
  locked: boolean;
};

type DashboardUsersResponse = {
  users: DashboardUser[];
  total: number;
  limit: number;
  offset: number;
};

function getDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  return user.email ?? "Unnamed user";
}

function getInitials(user: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}) {
  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((value) => value!.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  if (initials) {
    return initials;
  }

  return (user.email ?? "U").charAt(0).toUpperCase();
}

export function UsersTable({
  initialData,
}: {
  initialData: DashboardUsersResponse;
}) {
  const [page, setPage] = useState(1);
  const pageSize = initialData.limit;
  const [users, setUsers] = useState<DashboardUser[]>(initialData.users);
  const [total, setTotal] = useState(initialData.total);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const loadUsers = useCallback(
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

        const response = await fetch(`/api/users?${params.toString()}`, {
          signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load users.");
        }

        const data = (await response.json()) as DashboardUsersResponse;
        const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

        if (page > totalPages) {
          setPage(totalPages);
          return;
        }

        setUsers(data.users);
        setTotal(data.total);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }

        setError("Unable to load users right now.");
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

    void loadUsers(controller.signal);

    return () => controller.abort();
  }, [loadUsers]);

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
            placeholder="Search users"
            className="h-11 rounded-2xl border-white/10 bg-white/5 pl-11"
          />
        </div>
        <CreateUserDialog />
      </div>
      <Card className="gap-3 border-white/10 bg-white/5 py-3 backdrop-blur-md">
        <CardContent className="px-6 py-0">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[34%]" />
              <col className="w-[22%]" />
              <col className="w-[24%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Id</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow className="border-white/10">
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground h-24 text-center"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : isLoading && users.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={5} className="h-24">
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
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="lg">
                          <AvatarImage
                            src={user.imageUrl ?? undefined}
                            alt={getDisplayName(user)}
                          />
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {getDisplayName(user)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="block truncate">
                        {user.email ?? "No email"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      <span className="block truncate">{user.id}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.locked ? "destructive" : "outline"}
                        className={
                          user.locked
                            ? undefined
                            : "border-white/10 bg-white/5 text-muted-foreground"
                        }
                      >
                        {user.locked ? "Locked" : "Unlocked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <UserRowActions
                        userId={user.id}
                        displayName={getDisplayName(user)}
                        isLocked={user.locked}
                        onDeleted={(deletedUserId) => {
                          setUsers((currentUsers) =>
                            currentUsers.filter((currentUser) => currentUser.id !== deletedUserId),
                          );
                          setTotal((currentTotal) => Math.max(0, currentTotal - 1));

                          if (users.length === 1 && page > 1) {
                            setPage((current) => current - 1);
                          } else {
                            void loadUsers();
                          }
                        }}
                        onChanged={() => {
                          void loadUsers();
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
