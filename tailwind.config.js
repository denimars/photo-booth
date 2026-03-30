/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0d0d0d",
        "bg-surface": "#1a1a1a",
        "accent-primary": "#f5c518",
        "accent-secondary": "#e63946",
        "text-primary": "#f0ede6",
        "text-muted": "#888888",
        border: "#2a2a2a",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        mono: ['"DM Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
