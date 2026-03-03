"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart, ChevronDown, ChevronRight, Trash2, Plus, X, LayoutList, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GroceryItemData } from "@/types/grocery";
import { GROCERY_CATEGORIES, type GroceryCategory } from "@/lib/constants";
import Link from "next/link";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<GroceryCategory, string> = {
  Produce: "🥦",
  Dairy: "🥛",
  "Meat & Seafood": "🥩",
  Bakery: "🍞",
  Pantry: "🥫",
  Frozen: "🧊",
  Beverages: "🥤",
  Snacks: "🍿",
  Condiments: "🧂",
  Other: "📦",
};

let nextId = 100;

// ─── GroceryItem row ──────────────────────────────────────────────────────────

function GroceryItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: GroceryItemData;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
          item.checked
            ? "bg-[#00D4AA] border-[#00D4AA]"
            : "border-border dark:border-white/20 hover:border-[#00D4AA]/50"
        )}
      >
        {item.checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Name + quantity + recipe tag */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("text-sm font-medium transition-all", item.checked && "line-through text-muted-foreground")}>
            {item.name}
          </span>
          {(item.quantity || item.unit) && (
            <span className="text-xs text-muted-foreground">
              {item.quantity} {item.unit}
            </span>
          )}
        </div>
        {item.recipeTitle && (
          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#54A0FF]/15 text-[#54A0FF] mt-0.5">
            from {item.recipeTitle}
          </span>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Category view ────────────────────────────────────────────────────────────

function CategorySection({
  category,
  items,
  onToggle,
  onDelete,
}: {
  category: GroceryCategory;
  items: GroceryItemData[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (items.length === 0) return null;
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="mb-2">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-4 py-2 text-left"
      >
        <span className="text-base">{CATEGORY_ICONS[category]}</span>
        <span className="text-sm font-bold flex-1">{category}</span>
        <span className="text-xs text-muted-foreground mr-2">{checkedCount}/{items.length}</span>
        {collapsed ? <ChevronRight size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {!collapsed && (
        <Card glass className="mx-4 overflow-hidden">
          <div className="divide-y divide-border dark:divide-white/5">
            {items.map((item) => (
              <GroceryItemRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── By Recipe view ───────────────────────────────────────────────────────────

function RecipeGroupSection({
  recipeTitle,
  items,
  onToggle,
  onDelete,
}: {
  recipeTitle: string;
  items: GroceryItemData[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="mb-2">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-4 py-2 text-left"
      >
        <BookOpen size={15} className="text-[#54A0FF] shrink-0" />
        <span className="text-sm font-bold flex-1 truncate">{recipeTitle}</span>
        <span className="text-xs text-muted-foreground mr-2">{checkedCount}/{items.length}</span>
        {collapsed ? <ChevronRight size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {!collapsed && (
        <Card glass className="mx-4 overflow-hidden">
          <div className="divide-y divide-border dark:divide-white/5">
            {items.map((item) => (
              <GroceryItemRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = "category" | "recipe";

export default function GroceryPage() {
  const [items, setItems] = useState<GroceryItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("category");
  const [newItemName, setNewItemName] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/grocery");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items ?? []);
        }
      } catch {
        // stay empty
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  function toggleItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
    fetch(`/api/grocery?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked }),
    }).catch(() => {});
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    fetch(`/api/grocery?id=${id}`, { method: "DELETE" }).catch(() => {});
  }

  function clearChecked() {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    setItems((prev) => prev.filter((i) => !i.checked));
    checkedIds.forEach((id) => fetch(`/api/grocery?id=${id}`, { method: "DELETE" }).catch(() => {}));
  }

  async function addItem() {
    if (!newItemName.trim()) return;
    const tempId = String(nextId++);
    const newItem: GroceryItemData = {
      id: tempId,
      name: newItemName.trim(),
      category: "Other",
      checked: false,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemName("");
    setAddingItem(false);

    try {
      const res = await fetch("/api/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newItem.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((i) => (i.id === tempId ? { ...i, id: data.item?.id ?? i.id } : i)));
      }
    } catch {}
  }

  const totalItems = items.length;
  const checkedCount = items.filter((i) => i.checked).length;

  // Category grouping
  const groupedByCategory = GROCERY_CATEGORIES.reduce<Record<GroceryCategory, GroceryItemData[]>>(
    (acc, cat) => { acc[cat] = items.filter((i) => i.category === cat); return acc; },
    {} as Record<GroceryCategory, GroceryItemData[]>
  );

  // Recipe grouping
  const recipeGroups: Record<string, GroceryItemData[]> = {};
  const manualItems: GroceryItemData[] = [];
  for (const item of items) {
    if (item.recipeTitle) {
      if (!recipeGroups[item.recipeTitle]) recipeGroups[item.recipeTitle] = [];
      recipeGroups[item.recipeTitle].push(item);
    } else {
      manualItems.push(item);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border dark:border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Grocery List</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {checkedCount}/{totalItems} items done
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("category")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === "category" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
                title="Group by category"
              >
                <LayoutList size={14} />
              </button>
              <button
                onClick={() => setViewMode("recipe")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === "recipe" ? "bg-card shadow-sm text-[#54A0FF]" : "text-muted-foreground"
                )}
                title="Group by recipe"
              >
                <BookOpen size={14} />
              </button>
            </div>
            {checkedCount > 0 && (
              <button
                onClick={clearChecked}
                className="text-xs font-semibold text-[#FF6B6B] px-3 py-1.5 rounded-full bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 transition-colors flex items-center gap-1"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {totalItems > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] transition-all duration-500"
              style={{ width: `${(checkedCount / totalItems) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Empty state */}
      {!loading && totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ShoppingCart size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-1">Your list is empty</h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-4">
            Add items below or import ingredients from your saved recipes.
          </p>
          <Link
            href="/recipes/saved"
            className="text-sm font-semibold px-4 py-2 rounded-full bg-[#00D4AA]/15 text-[#00D4AA] hover:bg-[#00D4AA]/25 transition-colors"
          >
            Browse Recipe Book
          </Link>
        </div>
      )}

      {/* Items */}
      <div className="pt-3">
        {viewMode === "category" ? (
          GROCERY_CATEGORIES.map((cat) => (
            <CategorySection
              key={cat}
              category={cat}
              items={groupedByCategory[cat]}
              onToggle={toggleItem}
              onDelete={deleteItem}
            />
          ))
        ) : (
          <>
            {Object.entries(recipeGroups).map(([title, groupItems]) => (
              <RecipeGroupSection
                key={title}
                recipeTitle={title}
                items={groupItems}
                onToggle={toggleItem}
                onDelete={deleteItem}
              />
            ))}
            {manualItems.length > 0 && (
              <RecipeGroupSection
                recipeTitle="Added Manually"
                items={manualItems}
                onToggle={toggleItem}
                onDelete={deleteItem}
              />
            )}
            {Object.keys(recipeGroups).length === 0 && manualItems.length === 0 && null}
          </>
        )}
      </div>

      {/* Add item form */}
      <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pb-4">
        <Card glass className="border-gradient shadow-2xl">
          <CardContent className="py-3 px-4">
            {addingItem ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addItem();
                    if (e.key === "Escape") setAddingItem(false);
                  }}
                  placeholder="Item name..."
                  className="flex-1 bg-transparent border-border dark:border-white/10"
                />
                <Button
                  onClick={addItem}
                  size="sm"
                  className="bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] text-white font-bold shrink-0"
                >
                  Add
                </Button>
                <button
                  onClick={() => setAddingItem(false)}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingItem(true)}
                className="w-full flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#00D4AA] flex items-center justify-center">
                  <Plus size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium">Add item to list</span>
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
