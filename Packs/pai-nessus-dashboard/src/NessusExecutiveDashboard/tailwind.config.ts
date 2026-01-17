import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./Components/**/*.{js,ts,jsx,tsx,mdx}",
    "./App/**/*.{js,ts,jsx,tsx,mdx}",
    "./Lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokyo Night Day theme colors
        primary: "#2e7de9",
        secondary: "#9854f1",
        success: "#33b579",
        warning: "#f0a020",
        danger: "#f52a65",
        info: "#118c74",
      },
    },
  },
  plugins: [],
}
export default config
