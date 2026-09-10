import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0d10",
          900: "#12151a",
          800: "#1a1e26",
          700: "#242933",
          600: "#323945",
          500: "#4a5262",
        },
        mist: {
          100: "#f4f2ee",
          200: "#e7e3db",
          300: "#d3ccbf",
          400: "#b3a996",
        },
        ember: {
          400: "#e0a96d",
          500: "#cf9257",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      backgroundImage: {
        "world-glow":
          "radial-gradient(circle at 50% -10%, rgba(224,169,109,0.12), transparent 55%)",
      },
      animation: {
        breathe: "breathe 6s ease-in-out infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
