"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChefHat,
  ShoppingCart,
  Target,
  TrendingUp,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ChefHat,
  ShoppingCart,
  Target,
  TrendingUp,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col",
        "w-64 h-screen",
        "bg-surface border-r border-border/50",
        "fixed left-0 top-0 z-40"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-coral">
          <span className="text-sm font-black text-white tracking-tight">F</span>
        </div>
        <span className="text-xl font-black tracking-tight bg-gradient-coral bg-clip-text text-transparent">
          FUEL
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "transition-all duration-200 group",
                "tap-scale",
                isActive
                  ? "bg-gradient-coral text-white shadow-lg shadow-red-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                  isActive
                    ? "text-white"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  isActive ? "font-semibold text-white" : ""
                )}
              >
                {item.label}
              </span>

              {/* Active indicator bar */}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border/50 px-3 py-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl",
            "text-muted-foreground hover:text-foreground hover:bg-surface-hover",
            "transition-all duration-200 tap-scale"
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="text-sm font-medium">Settings</span>
        </Link>

        {/* User avatar */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-teal flex items-center justify-center">
            <span className="text-xs font-bold text-white">U</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">User</span>
            <span className="text-xs text-muted-foreground">Free Plan</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
