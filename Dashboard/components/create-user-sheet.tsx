"use client";

import { FormEvent, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
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

const initialFormState = {
  email: "",
};

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const body = (await response.json().catch(() => null)) as
        | {
            error?: string;
            invitation?: {
              emailAddress?: string;
            };
          }
        | null;

      if (!response.ok) {
        toast.error("Failed to invite user", {
          description: body?.error ?? "Unable to send invite.",
        });
        return;
      }

      toast.success("Invitation sent", {
        description: `An invitation email was sent to ${
          body?.invitation?.emailAddress ?? form.email
        }.`,
      });
      setForm(initialFormState);
      setOpen(false);
    } catch {
      toast.error("Failed to invite user", {
        description: "Unable to send invitation right now.",
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
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            This sends a Clerk invitation email. The user will appear in the
            dashboard after accepting the invite and completing signup.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="px-6">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-5 animate-spin"
                />
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
