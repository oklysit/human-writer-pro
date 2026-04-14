import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Architecture / Interior palette
        primary: {
          DEFAULT: "#171717",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#404040",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#A16207",
          foreground: "#FFFFFF",
          hover: "#854D0E",
        },
        background: "#FAFAF7",
        foreground: "#171717",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#171717",
        },
        muted: {
          DEFAULT: "#F4F4F0",
          foreground: "#64748B",
        },
        border: "#E5E5E5",
        ring: "#171717",
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#15803D",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#A16207",
          foreground: "#FFFFFF",
        },
      },
      ringOffsetColor: {
        background: "#FAFAF7",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      borderRadius: {
        DEFAULT: "2px",
        none: "0",
        sm: "2px",
        md: "2px",
        lg: "2px",
        xl: "2px",
        "2xl": "2px",
        "3xl": "2px",
        full: "9999px",
      },
      boxShadow: {
        focus: "0 0 0 2px #171717, 0 0 0 4px #FAFAF7",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
