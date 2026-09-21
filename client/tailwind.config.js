/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      backgroundColor: {
        base: "#FAF8F5",
      },
      colors: {
        canvas: "#FAF8F5",      // warm light cream canvas (Linen)
        surface: "#FFFFFF",     // pure crisp white for cards, panels, modals
        "surface-2": "#F4F0E8", // warm cream secondary surface for lists, headers, hover
        "surface-3": "#E9E3D6", // warm stone tertiary for chips and inputs
        line: "#E3DCD0",        // refined warm cream border
        ink: "#1C1917",         // warm deep stone primary text
        muted: "#78716C",       // warm secondary text
        cream: {
          50: "#FCFBF9",
          100: "#FAF8F5",
          200: "#F4F0E8",
          300: "#E9E3D6",
          400: "#DDD6C7",
        },
        accent: {
          DEFAULT: "#292524",   // deep warm stone for primary buttons
          light: "#44403C",     // stone-700
          dark: "#1C1917",      // deep stone hover
          subtle: "#F4F0E8",    // soft cream highlight
          warm: "#B45309",      // warm caramel amber for tags & highlights
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        pop: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
