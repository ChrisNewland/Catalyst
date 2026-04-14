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
        cream: "#fdfaf3",
        ink: "#1f2933",
        moss: "#4b7f52",
        alarm: "#c24b3c",
      },
      minHeight: {
        "tap": "44px",
      },
      minWidth: {
        "tap": "44px",
      },
    },
  },
  plugins: [],
};

export default config;
