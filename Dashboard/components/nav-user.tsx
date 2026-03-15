"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Logout01Icon } from "@hugeicons/core-free-icons";

export function NavUser() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const name = user?.fullName ?? "Admin";
  const email = user?.primaryEmailAddress?.emailAddress ?? "Email";
  const fallback =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: "/login" });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          size="lg"
          className="cursor-default hover:bg-transparent active:bg-transparent"
        >
          <div>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user?.imageUrl} alt={name} />
              <AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {email}
              </span>
            </div>
            <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Sign out"
                  className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ml-auto inline-flex size-8 items-center justify-center rounded-md transition-colors"
                  disabled={isSigningOut}
                >
                  <HugeiconsIcon
                    icon={Logout01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Sign out?</p>
                  <p className="text-muted-foreground text-xs">
                    You will need to sign in again to access the admin
                    dashboard.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSigningOut}
                    onClick={() => setConfirmOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isSigningOut}
                    onClick={() => {
                      void handleSignOut();
                    }}
                  >
                    {isSigningOut ? (
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        strokeWidth={2}
                        className="size-4 animate-spin"
                      />
                    ) : (
                      "Sign out"
                    )}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
