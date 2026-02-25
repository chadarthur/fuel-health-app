"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChefHat,
  ShoppingCart,
  Target,
  TrendingUp,
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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "glass-nav",
        "md:hidden"
      )}
    >
      <div className="flex h-16 items-center justify-around px-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5",
                "w-14 py-1.5 rounded-xl",
                "transition-all duration-200 tap-scale",
                isActive
                  ? "text-transparent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                {isActive ? (
                  <div className="bg-gradient-coral rounded-lg p-0.5">
                    <Icon
                      className="h-5 w-5"
                      style={{
                        color: "transparent",
                        stroke: "url(#coral-gradient)",
                      }}
                    />
                    {/* Use a visible colored icon instead of SVG gradient */}
                    <Icon className="h-5 w-5 absolute inset-0.5 text-white" />
                  </div>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive
                    ? "bg-gradient-coral bg-clip-text text-transparent font-semibold"
                    : ""
                )}
              >
                {item.label}
              </span>

              {/* Active dot indicator */}
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
