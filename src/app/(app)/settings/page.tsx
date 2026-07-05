"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import useSWR from "swr";
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
  Users,
  UserPlus,
  Upload,
  BookOpen,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { usePreferences } from "@/hooks/use-preferences";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";


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

// ─── Sharing Section ──────────────────────────────────────────────────────────

interface HouseholdStatus {
  household: { id: string; members: { id: string; name: string | null; email: string | null }[] } | null;
  incoming: { id: string; from: string; createdAt: string }[];
  outgoing: { id: string; email: string; createdAt: string }[];
}

function SharingSection({ currentUserEmail }: { currentUserEmail: string }) {
  const { data, mutate, isLoading } = useSWR<HouseholdStatus>("/api/household", fetcher);
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const partner = data?.household?.members.find(
    (m) => m.email?.toLowerCase() !== currentUserEmail.toLowerCase()
  );

  async function sendInvite() {
    if (!inviteEmail.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMessage({ text: d.error || "Failed to send invite", error: true });
      } else {
        setMessage({ text: "Invite sent!", error: false });
        setInviteEmail("");
        mutate();
      }
    } finally {
      setBusy(false);
    }
  }

  async function respond(inviteId: string, action: "accept" | "decline") {
    setBusy(true);
    try {
      const res = await fetch("/api/household/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action }),
      });
      const d = await res.json();
      if (!res.ok) setMessage({ text: d.error || "Failed", error: true });
      else if (action === "accept") setMessage({ text: "You're now sharing recipes & groceries!", error: false });
      mutate();
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite(inviteId: string) {
    setBusy(true);
    try {
      await fetch(`/api/household?inviteId=${inviteId}`, { method: "DELETE" });
      mutate();
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setBusy(true);
    try {
      await fetch("/api/household", { method: "DELETE" });
      setMessage({ text: "You've stopped sharing.", error: false });
      mutate();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
        Sharing
      </p>
      <Card glass className="overflow-hidden">
        <CardContent className="px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                partner ? "bg-[#54A0FF]/15" : "bg-muted"
              )}
            >
              <Users size={16} className={partner ? "text-[#54A0FF]" : "text-muted-foreground"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Share recipes &amp; grocery list</p>
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? "Loading…"
                  : partner
                    ? `Sharing with ${partner.name || partner.email}`
                    : "Invite one person to share your recipe book and grocery list"}
              </p>
            </div>
          </div>

          {partner ? (
            <Button
              variant="outline"
              className="w-full gap-2 text-[#FF6B6B] border-[#FF6B6B]/30 hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B]"
              onClick={leave}
              disabled={busy}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
              Stop Sharing
            </Button>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendInvite(); }}
                  placeholder="partner@example.com"
                  className="flex-1"
                />
                <Button
                  onClick={sendInvite}
                  disabled={busy || !inviteEmail.trim()}
                  className="gap-1.5 bg-[#54A0FF] hover:bg-[#54A0FF]/90 text-white font-semibold shrink-0"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Invite
                </Button>
              </div>

              {data?.incoming?.map((inv) => (
                <div key={inv.id} className="flex items-center gap-2 p-3 rounded-xl bg-[#54A0FF]/10">
                  <p className="text-xs flex-1">
                    <span className="font-semibold">{inv.from}</span> invited you to share
                  </p>
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-black font-semibold"
                    onClick={() => respond(inv.id, "accept")}
                    disabled={busy}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => respond(inv.id, "decline")}
                    disabled={busy}
                  >
                    Decline
                  </Button>
                </div>
              ))}

              {data?.outgoing?.map((inv) => (
                <div key={inv.id} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 dark:bg-white/5">
                  <p className="text-xs flex-1 text-muted-foreground">
                    Invite pending: <span className="font-semibold text-foreground">{inv.email}</span>
                  </p>
                  <button
                    onClick={() => cancelInvite(inv.id)}
                    disabled={busy}
                    className="text-muted-foreground hover:text-[#FF6B6B]"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </>
          )}

          {message && (
            <p className={cn("text-xs text-center font-medium", message.error ? "text-[#FF6B6B]" : "text-[#00D4AA]")}>
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ─── Paprika Import Row ───────────────────────────────────────────────────────

function PaprikaImportRow() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      // Upload straight from the browser to Blob storage first — Paprika
      // exports routinely exceed the ~4.5MB request-body limit on
      // serverless functions, so the file never goes through our API route.
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(`paprika-imports/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });

      const res = await fetch("/api/recipes/import-paprika", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: blob.url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(data.error || "Import failed");
      } else {
        setResult(
          `Imported ${data.imported} recipe${data.imported !== 1 ? "s" : ""}` +
            (data.skipped ? ` (${data.skipped} already existed)` : "")
        );
      }
    } catch (err) {
      console.error("Paprika import error:", err);
      setResult("Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".paprikarecipes,.paprikarecipe"
        className="hidden"
        onChange={handleFile}
      />
      <SettingRow
        icon={importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        label={importing ? "Importing…" : "Import from Paprika"}
        value={result ?? "Upload a .paprikarecipes export file"}
        onClick={() => !importing && fileRef.current?.click()}
      />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { simpleMode, setSimpleMode } = usePreferences();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [clearing, setClearing] = useState(false);

  const { data: goalsData } = useSWR<{ calories: number; protein: number; carbs: number; fat: number }>(
    "/api/track/settings",
    fetcher
  );

  const userName = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "User";
  const userEmail = session?.user?.email ?? "";
  const userInitial = userName.charAt(0).toUpperCase();
  const joinDate = ""; // not stored in session

  const themeOptions: {
    value: ThemeOption;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "light", label: "Light", icon: <Sun size={15} /> },
    { value: "dark", label: "Dark", icon: <Moon size={15} /> },
    { value: "system", label: "System", icon: <Monitor size={15} /> },
  ];

  async function handleExportCSV() {
    try {
      const res = await fetch("/api/track/meals");
      if (!res.ok) return;
      const meals: {
        loggedAt: string;
        name: string;
        mealType: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }[] = await res.json();

      const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const rows = [
        ["Date", "Meal", "Type", "Calories", "Protein (g)", "Carbs (g)", "Fat (g)"],
        ...meals.map((m) => [
          m.loggedAt.split("T")[0],
          escape(m.name),
          m.mealType,
          String(Math.round(m.calories)),
          String(Math.round(m.protein)),
          String(Math.round(m.carbs)),
          String(Math.round(m.fat)),
        ]),
      ];
      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fuel-nutrition-history.csv";
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch {
      // leave button state unchanged on failure
    }
  }

  async function handleClearData() {
    setClearing(true);
    try {
      await fetch("/api/user/data", { method: "DELETE" });
    } finally {
      setClearing(false);
      setShowClearDialog(false);
    }
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
                    {userInitial}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">{userName}</p>
                  <p className="text-sm text-muted-foreground">
                    {userEmail}
                  </p>
                  {joinDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Member since {joinDate}
                    </p>
                  )}
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

        {/* ── App Mode ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            App Mode
          </p>
          <Card glass className="overflow-hidden">
            <SettingRow
              icon={<BookOpen size={16} />}
              label="Recipe Book Mode"
              value="Just recipes & grocery list — hides all macro tracking"
              iconBg={simpleMode ? "bg-[#00D4AA]/15" : undefined}
              rightElement={
                <Switch
                  checked={simpleMode}
                  onCheckedChange={(checked) => setSimpleMode(checked)}
                />
              }
            />
          </Card>
        </section>

        {/* ── Sharing ── */}
        <SharingSection currentUserEmail={userEmail} />

        {/* ── Macro Goals ── */}
        {!simpleMode && (
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
              Nutrition
            </p>
            <Card glass className="overflow-hidden">
              <SettingRow
                icon={<Target size={16} />}
                label="Macro Goals"
                value={
                  goalsData
                    ? `${Math.round(goalsData.calories)} kcal · ${Math.round(goalsData.protein)}g protein · ${Math.round(goalsData.carbs)}g carbs · ${Math.round(goalsData.fat)}g fat`
                    : "Loading…"
                }
                href="/settings/goals"
              />
            </Card>
          </section>
        )}

        {/* ── Whoop Integration ── */}
        {!simpleMode && (
          <Suspense fallback={null}>
            <WhoopSection />
          </Suspense>
        )}

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
            <PaprikaImportRow />
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
            Version 1.1.0 · Built with Next.js
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
              disabled={clearing}
              className="flex-1 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
            >
              {clearing ? <Loader2 size={14} className="animate-spin" /> : "Clear All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
