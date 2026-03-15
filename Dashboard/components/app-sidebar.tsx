"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSquare01Icon, UserIcon, AddTeamIcon, ChampionIcon, Calendar03Icon, Shield02Icon } from "@hugeicons/core-free-icons"
import Image from "next/image"

const data = {
  // user: {
  //   name: "shadcn",
  //   email: "m@example.com",
  //   avatar: "/avatars/shadcn.jpg",
  // },
  navMain: [
    {
      title: "Overview",
      url: "/",
      icon: (
        <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Users",
      url: "/users",
      icon: (
        <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Teams",
      url: "/teams",
      icon: (
        <HugeiconsIcon icon={AddTeamIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Leagues",
      url: "/leagues",
      icon: (
        <HugeiconsIcon icon={ChampionIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Matches",
      url: "/matches",
      icon: (
        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Moderation",
      url: "/moderation",
      icon: (
        <HugeiconsIcon icon={Shield02Icon} strokeWidth={2} />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit"
            >
                <Link href="/">
                <Image
                    src="/icon.png"
                    alt="GameOn"
                    width={32}
                    height={32}
                />
                <span className="text-base font-semibold">GameOn</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
