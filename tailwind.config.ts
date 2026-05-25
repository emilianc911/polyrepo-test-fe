import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50:  "#f5f7fb",
          100: "#e5e9f1",
          200: "#c8d0de",
          300: "#9ba6bb",
          400: "#6e7d99",
          500: "#4a5872",
          600: "#34405a",
          700: "#252e44",
          800: "#161c2c",
          900: "#0b1020",
          950: "#060914",
        },
      },
      fontFamily: {
        sans: [
          "system-ui", "-apple-system", "Segoe UI", "Roboto", "Inter",
          "Helvetica Neue", "Arial", "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
