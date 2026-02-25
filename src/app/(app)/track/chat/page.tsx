"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ChevronLeft, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { MealEntryData } from "@/types/macro";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TextMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MealLogMessage {
  id: string;
  role: "assistant";
  type: "meal_log";
  mealData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
  };
  timestamp: Date;
}

type Message = TextMessage | MealLogMessage;

function isMealLog(msg: Message): msg is MealLogMessage {
  return (msg as MealLogMessage).type === "meal_log";
}

// ─── Mock conversation ────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hey! 👋 I'm your nutrition AI. Tell me what you ate and I'll log the macros for you. You can say something like \"I just had 2 scrambled eggs with toast\" or \"large chicken Caesar salad for lunch\".",
    timestamp: new Date(),
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

interface MealConfirmCardProps {
  mealData: MealLogMessage["mealData"];
  onLog: () => void;
  logged: boolean;
}

function MealConfirmCard({ mealData, onLog, logged }: MealConfirmCardProps) {
  return (
    <Card
      className={cn(
        "w-full max-w-xs overflow-hidden transition-all",
        logged && "opacity-75"
      )}
      style={{ border: "1px solid rgba(255, 107, 107, 0.3)" }}
    >
      <div className="h-1 bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA]" />
      <CardContent className="pt-3 pb-3 px-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Log this meal?
        </p>
        <p className="text-sm font-bold mb-3">{mealData.name}</p>
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[
            { label: "Cal", value: mealData.calories, color: "#FF9F43" },
            { label: "P", value: `${mealData.protein}g`, color: "#54A0FF" },
            { label: "C", value: `${mealData.carbs}g`, color: "#FECA57" },
            { label: "F", value: `${mealData.fat}g`, color: "#A29BFE" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="flex flex-col items-center p-1.5 rounded-lg"
              style={{ backgroundColor: `${color}15` }}
            >
              <span className="text-xs font-black" style={{ color }}>
                {value}
              </span>
              <span className="text-[9px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        {logged ? (
          <div className="flex items-center gap-1.5 text-[#00D4AA] text-xs font-semibold">
            <CheckCircle size={12} />
            Logged!
          </div>
        ) : (
          <button
            onClick={onLog}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white text-xs font-bold tap-scale"
          >
            ✓ Log It
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Today's meal side panel ──────────────────────────────────────────────────

interface TodaysPanelProps {
  meals: MealEntryData[];
}

function TodaysPanel({ meals }: TodaysPanelProps) {
  return (
    <div className="hidden md:flex flex-col w-72 shrink-0 border-l border-border dark:border-white/5 p-4 space-y-3 overflow-y-auto">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        Today&apos;s Meals
      </p>
      {meals.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No meals logged yet.</p>
      ) : (
        meals.map((meal) => (
          <Card key={meal.id} glass>
            <CardContent className="py-2.5 px-3">
              <p className="text-xs font-semibold truncate">{meal.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                <span style={{ color: "#FF9F43" }}>{meal.calories} kcal</span>
                {" · "}
                <span style={{ color: "#54A0FF" }}>P{meal.protein}g</span>
                {" · "}
                <span style={{ color: "#FECA57" }}>C{meal.carbs}g</span>
                {" · "}
                <span style={{ color: "#A29BFE" }}>F{meal.fat}g</span>
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loggedMealIds, setLoggedMealIds] = useState<Set<string>>(new Set());
  const [todaysMeals, setTodaysMeals] = useState<MealEntryData[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const res = await fetch(
          `/api/track/meals?date=${new Date().toISOString().split("T")[0]}`
        );
        if (res.ok) {
          const data = await res.json();
          setTodaysMeals(data.meals ?? []);
        }
      } catch {}
    };
    fetchMeals();
  }, []);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setInput("");

    const userMsg: TextMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const history = messages
        .filter((m): m is TextMessage => !isMealLog(m))
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/track/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText: string = data.reply ?? data.message ?? "";

        // Check for meal_log tag
        const mealMatch = replyText.match(/<meal_log>([\s\S]*?)<\/meal_log>/);

        if (mealMatch) {
          try {
            const mealData = JSON.parse(mealMatch[1]) as MealLogMessage["mealData"];
            const cleanText = replyText.replace(/<meal_log>[\s\S]*?<\/meal_log>/, "").trim();

            if (cleanText) {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString() + "-text",
                  role: "assistant",
                  content: cleanText,
                  timestamp: new Date(),
                } as TextMessage,
              ]);
            }

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString() + "-meal",
                role: "assistant",
                type: "meal_log",
                mealData,
                timestamp: new Date(),
              } as MealLogMessage,
            ]);
          } catch {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "assistant",
                content: replyText,
                timestamp: new Date(),
              } as TextMessage,
            ]);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: replyText,
              timestamp: new Date(),
            } as TextMessage,
          ]);
        }
      } else {
        // Mock response
        const mockReply = getMockReply(userText);
        setMessages((prev) => [...prev, ...mockReply]);
      }
    } catch {
      const mockReply = getMockReply(userText);
      setMessages((prev) => [...prev, ...mockReply]);
    } finally {
      setSending(false);
    }
  }

  async function logMealFromCard(msgId: string, mealData: MealLogMessage["mealData"]) {
    try {
      await fetch("/api/track/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...mealData, source: "chat" }),
      });
      setLoggedMealIds((prev) => new Set([...prev, msgId]));
      setTodaysMeals((prev) => [
        ...prev,
        {
          id: msgId,
          name: mealData.name,
          mealType: mealData.mealType,
          calories: mealData.calories,
          protein: mealData.protein,
          carbs: mealData.carbs,
          fat: mealData.fat,
          source: "chat",
          loggedAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setLoggedMealIds((prev) => new Set([...prev, msgId]));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:flex-row bg-background">
      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border dark:border-white/5 shrink-0">
          <Link
            href="/track"
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#00D4AA] flex items-center justify-center text-sm font-bold text-white">
              AI
            </div>
            <div>
              <p className="text-sm font-bold">Nutrition AI</p>
              <p className="text-[10px] text-[#00D4AA]">● Online</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            if (isMealLog(msg)) {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="flex flex-col gap-1">
                    <MealConfirmCard
                      mealData={msg.mealData}
                      onLog={() => logMealFromCard(msg.id, msg.mealData)}
                      logged={loggedMealIds.has(msg.id)}
                    />
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
                      <Clock size={8} />
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            }

            const textMsg = msg as TextMessage;
            return (
              <div
                key={textMsg.id}
                className={cn("flex", isUser ? "justify-end" : "justify-start")}
              >
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      isUser
                        ? "rounded-br-sm text-white"
                        : "rounded-bl-sm bg-card border border-border dark:border-white/5"
                    )}
                    style={
                      isUser
                        ? { background: "linear-gradient(135deg, #FF6B6B, #e05050)" }
                        : {}
                    }
                  >
                    {textMsg.content}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] text-muted-foreground flex items-center gap-1 mt-1 px-1",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <Clock size={8} />
                    {textMsg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-card border border-border dark:border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border dark:border-white/5 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What did you eat? ..."
              rows={1}
              className="flex-1 bg-card border border-border dark:border-white/5 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#FF6B6B]/30 max-h-32 overflow-y-auto"
              style={{ lineHeight: "1.5" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all tap-scale",
                input.trim() && !sending
                  ? "bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white shadow-lg shadow-[#FF6B6B]/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Desktop side panel */}
      <TodaysPanel meals={todaysMeals} />
    </div>
  );
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

function getMockReply(userText: string): Message[] {
  const lower = userText.toLowerCase();
  const hasFood =
    lower.includes("ate") ||
    lower.includes("had") ||
    lower.includes("eat") ||
    lower.includes("breakfast") ||
    lower.includes("lunch") ||
    lower.includes("dinner") ||
    lower.includes("snack") ||
    lower.includes("meal") ||
    lower.includes("drink") ||
    lower.includes("shake");

  if (hasFood) {
    return [
      {
        id: Date.now().toString() + "-text",
        role: "assistant",
        content: "Great! I analyzed that for you. Here are the estimated macros:",
        timestamp: new Date(),
      } as TextMessage,
      {
        id: Date.now().toString() + "-meal",
        role: "assistant",
        type: "meal_log",
        mealData: {
          name: userText.length > 40 ? userText.slice(0, 40) + "..." : userText,
          calories: 420,
          protein: 32,
          carbs: 38,
          fat: 14,
          mealType: "snack",
        },
        timestamp: new Date(),
      } as MealLogMessage,
    ];
  }

  return [
    {
      id: Date.now().toString(),
      role: "assistant",
      content:
        "Tell me what you ate and I'll estimate the macros! For example: \"I had oatmeal with banana and peanut butter for breakfast\" or \"Lunch was a big chicken sandwich and fries\".",
      timestamp: new Date(),
    } as TextMessage,
  ];
}
