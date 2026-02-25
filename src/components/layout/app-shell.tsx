"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className={cn("flex flex-col min-h-screen", "md:ml-64")}>
        {/* Header */}
        <Header />

        {/* Scrollable content */}
        <main
          className={cn(
            "flex-1",
            "px-4 py-4 md:px-6 md:py-6",
            "pb-20 md:pb-6",
            "overflow-y-auto"
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
