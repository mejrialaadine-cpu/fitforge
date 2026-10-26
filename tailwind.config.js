/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forgeBg: "#0B0D0F",
        forgeCard: "#15191D",
        forgeLime: "#B8F34A",
      },
    },
  },
  plugins: [],
}
