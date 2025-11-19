"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, PieChart, TrendingUp, Eye, BookOpen, User, Wallet, Settings } from 'lucide-react'
import { cn } from "@/lib/utils"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Platform",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Portfolio",
        url: "/portfolio",
        icon: PieChart,
        badge: "Soon",
      },
      {
        title: "Trading",
        url: "/trading",
        icon: TrendingUp,
      },
      {
        title: "Watchlist",
        url: "/watchlist",
        icon: Eye,
        badge: "Soon",
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "Academy",
        url: "/academy",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        url: "/profile",
        icon: User,
      },
      {
        title: "Wallet",
        url: "/wallet",
        icon: Wallet,
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image 
                    src="/praxos-icon.svg" 
                    alt="Praxos" 
                    width={32} 
                    height={32}
                    className="size-8"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Praxos</span>
                  <span className="truncate text-xs">TradFi Liquidity Protocol</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.url || (item.url === "/" && pathname === "/")
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive} 
                        tooltip={item.title}
                        className={cn(
                          "transition-all duration-200",
                          isActive 
                            ? "bg-white text-black hover:bg-white/90 hover:text-black rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                            : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
                          item.badge === "Soon" && "text-muted-foreground/50 hover:text-muted-foreground/70"
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon className={cn(item.badge === "Soon" && "opacity-50")} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && (
                        <span className={cn(
                          "absolute right-2 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium group-data-[collapsible=icon]:hidden",
                          item.badge === "Soon" 
                            ? "bg-primary/20 text-primary opacity-70" 
                            : "bg-primary/20 text-primary"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/settings">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                  <Settings className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Settings</span>
                  <span className="truncate text-xs">Preferences</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
