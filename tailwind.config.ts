import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Maskell industrial QA palette — high contrast for outdoor phone use
        ink: "#101418",
        panel: "#171d24",
        line: "#2a323b",
        accent: "#ff7a1a", // safety-orange — action / progress
        good: "#22c55e",
        bad: "#ef4444",
        warn: "#f5b800",
        paper: "#f7f5f1",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      spacing: {
        touch: "3.25rem", // minimum touch target
      },
    },
  },
  plugins: [],
};
export default config;
