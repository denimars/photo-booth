/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#FAFAF8",      // warm off-white
        "bg-surface": "#FFFFFF",       // white
        "accent-primary": "#D4A59A",   // dusty rose/soft coral
        "accent-secondary": "#88AEA4", // muted sage teal
        "text-primary": "#3D3D3D",     // soft charcoal
        "text-muted": "#9E9E9E",       // medium gray
        border: "#EBEBEB",             // soft gray
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        mono: ['"DM Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
