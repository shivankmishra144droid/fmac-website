import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm near-black backgrounds (never pure #000)
        ink: {
          DEFAULT: "#0b0906",
          950: "#0b0906",
          900: "#120e08",
          800: "#1a140c",
          700: "#241b10",
        },
        // Projector / marquee warm light
        beam: {
          DEFAULT: "#f6c453",
          soft: "#ffd98a",
          deep: "#c8922f",
        },
        // Primary CTA yellow
        marquee: {
          DEFAULT: "#eab308",
          400: "#facc15",
          600: "#ca8a04",
        },
        celluloid: "#efe6d3",
        // Alias of celluloid — warm off-white used for text across pages.
        parchment: "#efe6d3",
        smoke: "#a89f8e",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        // Legacy alias — maps to body after typography upgrade.
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      fontSize: {
        /* 1.25 modular scale — base 16px */
        caption: ["0.64rem", { lineHeight: "1.4" }],
        label: ["0.8rem", { lineHeight: "1.45" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-lg": ["1.25rem", { lineHeight: "1.55" }],
        "display-sm": ["1.563rem", { lineHeight: "1.1" }],
        display: ["1.953rem", { lineHeight: "1.05" }],
        "display-lg": ["2.441rem", { lineHeight: "1" }],
        "display-xl": ["3.052rem", { lineHeight: "0.95" }],
      },
      letterSpacing: {
        tightest: "-0.06em",
        display: "-0.02em",
        label: "0.09em",
        meta: "0.04em",
      },
      keyframes: {
        "marquee-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(234,179,8,0.0), 0 0 22px 2px rgba(234,179,8,0.35)",
          },
          "50%": {
            boxShadow:
              "0 0 0 0 rgba(234,179,8,0.0), 0 0 40px 8px rgba(234,179,8,0.55)",
          },
        },
        "dust-drift": {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0" },
          "10%": { opacity: "0.5" },
          "90%": { opacity: "0.4" },
          "100%": {
            transform: "translateY(-120px) translateX(12px)",
            opacity: "0",
          },
        },
      },
      animation: {
        "marquee-pulse": "marquee-pulse 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
