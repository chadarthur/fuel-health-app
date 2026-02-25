"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

function getPageTitle(pathname: string): string {
  // Check NAV_ITEMS first
  const navItem = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  if (navItem) return navItem.label;

  // Fallback to Settings or generic
  if (pathname.startsWith("/settings")) return "Settings";

  return "FUEL";
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30",
        "flex h-14 items-center justify-between",
        "px-4 md:px-6",
        "bg-background/80 backdrop-blur-xl",
        "border-b border-border/50"
      )}
    >
      {/* Page title */}
      <div className="flex items-center gap-3">
        {/* Mobile: show logo mark */}
        <div className="flex md:hidden h-7 w-7 items-center justify-center rounded-lg bg-gradient-coral">
          <span className="text-[10px] font-black text-white tracking-tight">F</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* User avatar - visible on desktop */}
        <button
          className={cn(
            "hidden md:flex",
            "h-9 w-9 items-center justify-center rounded-xl",
            "bg-gradient-teal",
            "transition-all duration-200 tap-scale",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <span className="text-xs font-bold text-white">U</span>
        </button>
      </div>
    </header>
  );
}
