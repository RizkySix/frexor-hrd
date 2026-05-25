import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dde9ff",
          500: "#3b6ef0",
          600: "#2f56c4",
          700: "#264aa3",
        },
      },
    },
  },
  plugins: [],
};

export default config;
