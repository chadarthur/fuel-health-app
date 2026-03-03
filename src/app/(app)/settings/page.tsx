"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Target,
  Activity,
  Palette,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Download,
  Trash2,
  Check,
  Unlink,
  Loader2,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// ─── Profile data ─────────────────────────────────────────────────────────────

const DEMO_PROFILE = {
  name: "Demo User",
  email: "demo@fuel.app",
  initials: "D",
  joinDate: "January 2025",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
  iconBg?: string;
}

function SettingRow({
  icon,
  label,
  value,
  href,
  onClick,
  danger,
  rightElement,
  iconBg,
}: SettingRowProps) {
  const interactive = !!(href || onClick);
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 py-3.5 px-4",
        interactive && "hover:bg-white/[0.03] transition-colors cursor-pointer"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          danger ? "bg-[#FF6B6B]/15" : (iconBg ?? "bg-muted")
        )}
      >
        <span
          className={cn(
            "w-4 h-4",
            danger ? "text-[#FF6B6B]" : "text-muted-foreground"
          )}
        >
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", danger && "text-[#FF6B6B]")}>
          {label}
        </p>
        {value && (
          <p className="text-xs text-muted-foreground mt-0.5">{value}</p>
        )}
      </div>
      {rightElement ??
        (interactive ? (
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        ) : null)}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

type ThemeOption = "light" | "dark" | "system";

// ─── WHOOP Section ────────────────────────────────────────────────────────────

function WhoopSection() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [connected, setConnected] = useState<boolean | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/whoop/status")
      .then((r) => r.json())
      .then((d) => setConnected(d.connected))
      .catch(() => setConnected(false));
  }, []);

  // Handle redirect-back messages
  useEffect(() => {
    const result = searchParams.get("whoop");
    if (result === "connected") {
      setConnected(true);
      setToast("WHOOP connected!");
      router.replace("/settings", { scroll: false });
    } else if (result === "error") {
      setToast("Failed to connect WHOOP. Please try again.");
      router.replace("/settings", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/whoop/disconnect", { method: "POST" });
      setConnected(false);
      setToast("WHOOP disconnected.");
    } finally {
      setDisconnecting(false);
    }
  }

  const isLoading = connected === null;

  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
        Whoop Integration
      </p>
      <Card glass className="overflow-hidden">
        <CardContent className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                connected ? "bg-[#00D4AA]/10" : "bg-muted"
              )}
            >
              <Activity
                size={16}
                className={connected ? "text-[#00D4AA]" : "text-muted-foreground"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold">Whoop Status</p>
                {isLoading ? (
                  <Loader2 size={12} className="animate-spin text-muted-foreground" />
                ) : connected ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D4AA]/15 text-[#00D4AA]">
                    Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {connected
                  ? "Syncing recovery, strain & sleep data"
                  : "Connect to see your real WHOOP metrics"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {connected ? (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Unlink size={14} />
                )}
                Disconnect WHOOP
              </Button>
            ) : (
              <Button
                className="flex-1 bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-black font-semibold gap-2"
                onClick={() => { window.location.href = "/api/whoop/connect"; }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Activity size={14} />
                )}
                Connect WHOOP
              </Button>
            )}
          </div>

          {toast && (
            <p
              className={cn(
                "mt-2 text-xs text-center font-medium",
                toast.includes("connect") || toast.includes("Sync")
                  ? "text-[#00D4AA]"
                  : "text-[#FF6B6B]"
              )}
            >
              {toast}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const themeOptions: {
    value: ThemeOption;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "light", label: "Light", icon: <Sun size={15} /> },
    { value: "dark", label: "Dark", icon: <Moon size={15} /> },
    { value: "system", label: "System", icon: <Monitor size={15} /> },
  ];

  function handleExportCSV() {
    const rows = [
      ["Date", "Meal", "Calories", "Protein (g)", "Carbs (g)", "Fat (g)"],
      ["2025-01-20", "Greek Yogurt Parfait", "380", "28", "46", "8"],
      ["2025-01-20", "Grilled Chicken & Quinoa Bowl", "620", "48", "72", "18"],
      ["2025-01-20", "Protein Shake", "240", "30", "24", "4"],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "health-data.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  }

  function handleClearData() {
    setShowClearDialog(false);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your preferences
        </p>
      </div>

      <div className="px-4 space-y-5">
        {/* ── Profile ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            Profile
          </p>
          <Card glass>
            <CardContent className="py-5 px-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#00D4AA] flex items-center justify-center shrink-0">
                  <span className="text-white text-2xl font-black">
                    {DEMO_PROFILE.initials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">{DEMO_PROFILE.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {DEMO_PROFILE.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Member since {DEMO_PROFILE.joinDate}
                  </p>
                </div>
                <button
                  disabled
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FF6B6B]/10 text-[#FF6B6B] opacity-50 cursor-not-allowed shrink-0"
                >
                  Edit Profile
                </button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Macro Goals ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            Nutrition
          </p>
          <Card glass className="overflow-hidden">
            <SettingRow
              icon={<Target size={16} />}
              label="Macro Goals"
              value="2000 kcal · 150g protein · 250g carbs · 65g fat"
              href="/settings/goals"
            />
          </Card>
        </section>

        {/* ── Whoop Integration ── */}
        <Suspense fallback={null}>
          <WhoopSection />
        </Suspense>

        {/* ── Appearance / Theme ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            Appearance
          </p>
          <Card glass>
            <CardContent className="py-4 px-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Palette size={16} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">Theme</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all active:scale-95",
                      theme === value
                        ? "bg-[#FF6B6B]/15 border-[#FF6B6B] text-[#FF6B6B]"
                        : "bg-transparent border-border dark:border-white/10 text-muted-foreground hover:border-white/20"
                    )}
                  >
                    {icon}
                    <span className="text-xs font-semibold">{label}</span>
                    {theme === value && (
                      <Check size={10} className="text-[#FF6B6B]" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Data & Privacy ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            Data &amp; Privacy
          </p>
          <Card glass className="overflow-hidden divide-y divide-border dark:divide-white/5">
            <SettingRow
              icon={<Download size={16} />}
              label={exportDone ? "Exported!" : "Export as CSV"}
              value="Download your nutrition history as a CSV file"
              onClick={handleExportCSV}
              iconBg={exportDone ? "bg-[#00D4AA]/15" : undefined}
              rightElement={
                exportDone ? (
                  <Check size={14} className="text-[#00D4AA] shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                )
              }
            />
            <SettingRow
              icon={<Trash2 size={16} />}
              label="Clear All Data"
              value="Remove all meals, grocery items, and saved recipes"
              onClick={() => setShowClearDialog(true)}
              danger
            />
          </Card>
        </section>

        {/* ── Sign Out ── */}
        <section>
          <Button
            variant="outline"
            className="w-full gap-2 text-[#FF6B6B] border-[#FF6B6B]/30 hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B]"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut size={15} />
            Sign Out
          </Button>
        </section>

        {/* App info footer */}
        <div className="text-center pt-2 pb-4">
          <p className="text-xs text-muted-foreground">Health Super App</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Version 1.0.0 · Built with Next.js 15
          </p>
        </div>
      </div>

      {/* ── Clear Data Confirmation Dialog ── */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-[#FF6B6B]">Clear All Data?</DialogTitle>
            <DialogDescription>
              This will permanently remove all your meals, grocery items, and
              saved recipes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 mt-2">
            <DialogClose asChild>
              <Button variant="ghost" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleClearData}
              className="flex-1 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
            >
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
