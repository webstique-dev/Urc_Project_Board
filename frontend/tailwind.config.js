/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0C0A14",        // app background
        surface: "#17141F",     // cards, panels
        "surface-2": "#1E1A29", // hover / raised surface
        "surface-3": "#26202F", // inputs
        line: "rgba(255,255,255,0.08)",
        ink: "#EDEBF5",         // primary text on dark
        muted: "#9A93B0",       // secondary text
        accent: {
          DEFAULT: "#7C5CFF",   // one bold accent color for the whole app
          light: "#9B82FF",
          dark: "#5F42D9",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4)",
        pop: "0 12px 40px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
