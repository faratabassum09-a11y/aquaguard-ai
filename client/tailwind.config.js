/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#07111F",
        panel: "#0D1B2E",
        panelBorder: "#1B2F47",
        waterblue: "#00B8FF",
        safe: "#35D07F",
        watch: "#F2C94C",
        high: "#FFB020",
        critical: "#FF4D5E",
        mist: "#8CA3BF",
      },
      fontFamily: {
        display: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(0,184,255,0.25)",
      },
    },
  },
  plugins: [],
};
