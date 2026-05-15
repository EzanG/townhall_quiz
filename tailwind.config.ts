import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        seat: {
          idle: "#9ca3af",
          live: "#22c55e",
          out: "#ef4444",
          active: "#16a34a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
