"use client";

import { FormEvent, useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserOption = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
};

const sportOptions = [
  { id: "soccer", label: "Soccer" },
  { id: "basketball", label: "Basketball" },
  { id: "volleyball", label: "Volleyball" },
] as const;

const scopeOptions = [
  { id: "casual", label: "Casual" },
  { id: "managed", label: "Managed" },
  { id: "league_ready", label: "League Ready" },
] as const;

const cityOptions = [
  { id: "Montreal", label: "Montreal" },
  { id: "Toronto", label: "Toronto" },
  { id: "Vancouver", label: "Vancouver" },
] as const;

const initialFormState = {
  ownerUserId: "",
  name: "",
  sport: "soccer",
  scope: "casual",
  location: "Montreal",
};

function getDisplayName(user: UserOption) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  return user.email ?? user.id;
}

function getInitials(user: UserOption) {
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

export function CreateTeamDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [owners, setOwners] = useState<UserOption[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || owners.length > 0) {
      return;
    }

    let cancelled = false;

    async function loadOwners() {
      setIsLoadingOwners(true);

      try {
        const response = await fetch("/api/users/options");
        const body = (await response.json()) as { users?: UserOption[]; error?: string };

        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load users.");
        }

        if (!cancelled) {
          setOwners(body.users ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error("Failed to load users", {
            description:
              error instanceof Error ? error.message : "Please try again.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOwners(false);
        }
      }
    }

    void loadOwners();

    return () => {
      cancelled = true;
    };
  }, [open, owners.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/teams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerUserId: form.ownerUserId,
          name: form.name,
          sport: form.sport,
          scope: form.scope,
          location: form.location,
          allowedRegions: [form.location],
          privacy: "PRIVATE",
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | {
            error?: string;
            team?: {
              name?: string;
            };
          }
        | null;

      if (!response.ok) {
        toast.error("Failed to create team", {
          description: body?.error ?? "Unable to create team.",
        });
        return;
      }

      toast.success("Team created", {
        description: `${body?.team?.name ?? form.name} was created successfully.`,
      });
      setForm(initialFormState);
      setOpen(false);
      onCreated();
    } catch {
      toast.error("Failed to create team", {
        description: "Unable to create team right now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-36 h-11 justify-center">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Create a team, choose who owns it, and define the key details it
            will use across GameOn.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="px-6">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="team-owner">Owner</FieldLabel>
                <Select
                  value={form.ownerUserId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, ownerUserId: value }))
                  }
                  disabled={isLoadingOwners}
                >
                  <SelectTrigger id="team-owner" className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingOwners ? "Loading users..." : "Select owner"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage src={owner.imageUrl ?? undefined} />
                            <AvatarFallback>{getInitials(owner)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate">{getDisplayName(owner)}</div>
                            <div className="text-muted-foreground truncate text-xs">
                              {owner.email ?? owner.id}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="team-name">Name</FieldLabel>
                <Input
                  id="team-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="team-sport">Sport</FieldLabel>
                <Select
                  value={form.sport}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, sport: value }))
                  }
                >
                  <SelectTrigger id="team-sport" className="w-full">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sportOptions.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="team-scope">Scope</FieldLabel>
                <Select
                  value={form.scope}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, scope: value }))
                  }
                >
                  <SelectTrigger id="team-scope" className="w-full">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((scope) => (
                      <SelectItem key={scope.id} value={scope.id}>
                        {scope.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="team-location">Location</FieldLabel>
                <Select
                  value={form.location}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, location: value }))
                  }
                >
                  <SelectTrigger id="team-location" className="w-full">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map((city) => (
                      <SelectItem key={city.id} value={city.label}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || isLoadingOwners}>
              {isSubmitting ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-5 animate-spin"
                />
              ) : (
                "Create Team"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
