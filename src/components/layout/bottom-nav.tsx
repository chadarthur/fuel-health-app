"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChefHat,
  ShoppingCart,
  Target,
  TrendingUp,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/hooks/use-preferences";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Recipes",   href: "/recipes",   icon: ChefHat },
  { label: "Grocery",   href: "/grocery",   icon: ShoppingCart },
  { label: "Track",     href: "/track",     icon: Target },
  { label: "Insights",  href: "/insights",  icon: TrendingUp },
  { label: "Settings",  href: "/settings",  icon: Cog },
];

const SIMPLE_NAV = NAV.filter((n) =>
  ["/recipes", "/grocery", "/settings"].includes(n.href)
);

export function BottomNav() {
  const pathname = usePathname();
  const { simpleMode } = usePreferences();
  const nav = simpleMode ? SIMPLE_NAV : NAV;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "glass-nav",
        "md:hidden"
      )}
    >
      <div className="flex h-16 items-center justify-around px-1 pb-safe">
        {nav.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5",
                "flex-1 py-1.5 rounded-xl",
                "transition-all duration-200 tap-scale",
                !isActive && "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
                  isActive && "bg-gradient-coral"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-white")} />
              </div>

              <span
                className={cn(
                  "text-[9px] font-medium leading-none",
                  isActive
                    ? "bg-gradient-coral bg-clip-text text-transparent font-semibold"
                    : ""
                )}
              >
                {label}
              </span>

              {isActive && (
                <div className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-gradient-coral" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
