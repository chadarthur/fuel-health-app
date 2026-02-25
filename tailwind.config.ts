import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Surface cards
        surface: {
          DEFAULT: "hsl(var(--surface))",
          hover: "hsl(var(--surface-hover))",
        },
        // Brand
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Macro colors (Tiimo x NRC palette)
        calories: "#FF9F43",
        protein: "#54A0FF",
        carbs: "#FECA57",
        fat: "#A29BFE",
        // Health metrics
        recovery: "#00D4AA",
        strain: "#FF6B6B",
        sleep: "#54A0FF",
        hrv: "#A29BFE",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "stat-lg": ["3.5rem", { lineHeight: "1", fontWeight: "700" }],
        "stat-md": ["2.5rem", { lineHeight: "1", fontWeight: "700" }],
        "stat-sm": ["1.75rem", { lineHeight: "1", fontWeight: "700" }],
      },
      backgroundImage: {
        "gradient-coral": "linear-gradient(135deg, #FF6B6B, #FF8E8E)",
        "gradient-teal": "linear-gradient(135deg, #00D4AA, #4AEDC4)",
        "gradient-orange": "linear-gradient(135deg, #FF9F43, #FFBE76)",
        "gradient-blue": "linear-gradient(135deg, #54A0FF, #78B8FF)",
        "gradient-purple": "linear-gradient(135deg, #A29BFE, #C5B9FF)",
        "gradient-yellow": "linear-gradient(135deg, #FECA57, #FFE08A)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
