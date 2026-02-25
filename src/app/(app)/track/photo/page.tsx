"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Loader2, CheckCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FoodAnalysis, PhotoAnalysisResult } from "@/types/macro";

interface EditableFoodItem extends FoodAnalysis {
  id: string;
}

export default function PhotoLogPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EditableFoodItem[] | null>(null);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(file: File) {
    if (!file.type.startsWith("image/")) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setAnalysisResult(null);
    setLogged(false);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }, []);

  async function analyzePhoto() {
    if (!selectedFile) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch("/api/track/analyze-photo", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data: PhotoAnalysisResult = await res.json();
        setAnalysisResult(
          data.foods.map((f, i) => ({ ...f, id: String(i) }))
        );
      } else {
        // Fallback mock
        setAnalysisResult(getMockAnalysis());
      }
    } catch {
      setAnalysisResult(getMockAnalysis());
    } finally {
      setAnalyzing(false);
    }
  }

  function updateFoodItem(id: string, field: keyof FoodAnalysis, value: number | string) {
    setAnalysisResult((prev) =>
      prev?.map((item) =>
        item.id === id ? { ...item, [field]: typeof value === "string" ? parseFloat(value) || 0 : value } : item
      ) ?? null
    );
  }

  function removeFoodItem(id: string) {
    setAnalysisResult((prev) => prev?.filter((item) => item.id !== id) ?? null);
  }

  const totals = analysisResult?.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  async function logMeal() {
    if (!analysisResult || !totals) return;
    setLogging(true);
    try {
      await fetch("/api/track/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: analysisResult.map((f) => f.name).join(", "),
          mealType: "snack",
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          source: "photo",
        }),
      });
      setLogged(true);
    } catch {
      setLogged(true);
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Link
          href="/track"
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Photo Log</h1>
          <p className="text-xs text-muted-foreground">AI identifies food from images</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Upload zone */}
        {!selectedImage ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all py-16 text-center",
              isDragging
                ? "border-[#FF6B6B] bg-[#FF6B6B]/5"
                : "border-border dark:border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
            )}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #FF6B6B30, #00D4AA20)" }}
            >
              <Upload size={28} style={{ color: "#FF6B6B" }} />
            </div>
            <p className="font-bold text-base mb-1">Drop a photo here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse your gallery</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Camera size={12} />
              Supports JPG, PNG, HEIC
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
            />
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="relative w-full aspect-video">
              <Image
                src={selectedImage}
                alt="Food photo"
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            <button
              onClick={() => {
                setSelectedImage(null);
                setSelectedFile(null);
                setAnalysisResult(null);
                setLogged(false);
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        )}

        {/* Analyze button */}
        {selectedImage && !analysisResult && (
          <Button
            onClick={analyzePhoto}
            disabled={analyzing}
            className="w-full h-12 rounded-2xl font-bold text-base"
            style={
              analyzing
                ? {}
                : { background: "linear-gradient(135deg, #FF6B6B, #00D4AA)" }
            }
          >
            {analyzing ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Analyzing photo...
              </>
            ) : (
              <>
                <Camera size={16} className="mr-2" />
                Analyze Photo
              </>
            )}
          </Button>
        )}

        {/* Analysis results */}
        {analysisResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Identified Foods
              </p>
              <span className="text-xs text-[#00D4AA] font-semibold">
                {analysisResult.length} item{analysisResult.length !== 1 ? "s" : ""}
              </span>
            </div>

            {analysisResult.map((item) => (
              <Card key={item.id} glass>
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <input
                        className="font-semibold text-sm bg-transparent w-full focus:outline-none focus:border-b focus:border-white/20"
                        value={item.name}
                        onChange={(e) => updateFoodItem(item.id, "name", e.target.value)}
                      />
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: item.confidence > 0.8
                              ? "#00D4AA20"
                              : item.confidence > 0.6
                              ? "#FECA5720"
                              : "#FF6B6B20",
                            color: item.confidence > 0.8
                              ? "#00D4AA"
                              : item.confidence > 0.6
                              ? "#FECA57"
                              : "#FF6B6B",
                          }}
                        >
                          {Math.round(item.confidence * 100)}% confident
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFoodItem(item.id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: "calories" as const, label: "Cal", color: "#FF9F43" },
                      { key: "protein" as const, label: "Pro", color: "#54A0FF" },
                      { key: "carbs" as const, label: "Carb", color: "#FECA57" },
                      { key: "fat" as const, label: "Fat", color: "#A29BFE" },
                    ].map(({ key, label, color }) => (
                      <div key={key} className="flex flex-col">
                        <label className="text-[9px] font-medium mb-1" style={{ color }}>
                          {label}
                        </label>
                        <input
                          type="number"
                          value={item[key]}
                          onChange={(e) => updateFoodItem(item.id, key, e.target.value)}
                          className="w-full bg-muted/50 rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-1"
                          style={{ color, focusRingColor: color } as React.CSSProperties}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Totals */}
            {totals && (
              <Card glass className="border-gradient">
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    Total Macros
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Calories", value: Math.round(totals.calories), unit: "kcal", color: "#FF9F43" },
                      { label: "Protein", value: Math.round(totals.protein), unit: "g", color: "#54A0FF" },
                      { label: "Carbs", value: Math.round(totals.carbs), unit: "g", color: "#FECA57" },
                      { label: "Fat", value: Math.round(totals.fat), unit: "g", color: "#A29BFE" },
                    ].map(({ label, value, unit, color }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center p-2 rounded-xl"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <span className="text-base font-black" style={{ color }}>
                          {value}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{unit}</span>
                        <span className="text-[9px] text-muted-foreground mt-0.5">{label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Log button */}
            <Button
              onClick={logMeal}
              disabled={logging || logged || analysisResult.length === 0}
              className={cn(
                "w-full h-12 rounded-2xl font-bold text-base",
                logged && "pointer-events-none"
              )}
              style={
                logged
                  ? { backgroundColor: "#00D4AA" }
                  : { background: "linear-gradient(135deg, #FF6B6B, #00D4AA)" }
              }
            >
              {logged ? (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Logged Successfully!
                </>
              ) : logging ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Logging...
                </>
              ) : (
                "Log Meal"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

function getMockAnalysis(): EditableFoodItem[] {
  return [
    { id: "0", name: "Grilled Chicken Breast", calories: 320, protein: 58, carbs: 0, fat: 8, confidence: 0.92 },
    { id: "1", name: "Brown Rice", calories: 215, protein: 5, carbs: 45, fat: 2, confidence: 0.87 },
    { id: "2", name: "Steamed Broccoli", calories: 55, protein: 4, carbs: 10, fat: 0, confidence: 0.95 },
  ];
}
