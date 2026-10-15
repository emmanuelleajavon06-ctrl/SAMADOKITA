import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: "hsl(var(--accent))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "logo-pulse": {
          "0%, 100%": { transform: "scale(1)", filter: "drop-shadow(0 0 0 rgba(14,165,233,0))" },
          "50%": { transform: "scale(1.08)", filter: "drop-shadow(0 0 24px rgba(14,165,233,0.6))" },
        },
        "blob-morph": {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%", transform: "rotate(0deg) scale(1)" },
          "50%": { borderRadius: "30% 60% 70% 40% / 40% 70% 30% 60%", transform: "rotate(15deg) scale(1.1)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
        "logo-pulse": "logo-pulse 2s ease-in-out infinite",
        blob: "blob-morph 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
