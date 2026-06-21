/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0710",        // near-black, violet undertone — page background
        surface: "#15101F",    // panel background
        surface2: "#1D1730",   // raised panel / card background
        violet: {
          950: "#2E1065",
          900: "#3B0F7A",
          800: "#4C1D95",
          700: "#5B21B6",
          600: "#6D28D9",
          500: "#7C3AED",
          400: "#8B5CF6",
          300: "#A78BFA",
          200: "#C4B5FD",
          100: "#E5DBFF",
        },
        bone: "#F5F3FF",       // off-white, violet undertone
        gold: "#F2B65B",       // star rating accent — distinct from purple for legibility
        gold2: "#E8993D",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(139, 92, 246, 0.45)",
        card: "0 10px 40px -12px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.85) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
