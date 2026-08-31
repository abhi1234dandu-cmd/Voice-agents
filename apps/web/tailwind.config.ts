import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#071018",
          900: "#0c1722",
          800: "#132230",
          700: "#1d3142",
        },
        violet: {
          signal: "#8b5cf6",
        },
        teal: {
          signal: "#19d3c5",
        },
      },
      boxShadow: {
        glow: "0 18px 60px rgba(25, 211, 197, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
