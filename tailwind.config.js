/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9f4",
          100: "#dcf1e3",
          200: "#bbe2c8",
          300: "#8ecca6",
          400: "#5cae80",
          500: "#3a9163",
          600: "#2a744d",
          700: "#235c40",
          800: "#1f4a35",
          900: "#1a3d2d",
        },
        ink: {
          50: "#f7f7f6",
          100: "#eeeeec",
          200: "#d9d9d4",
          300: "#b5b5ad",
          400: "#8b8b80",
          500: "#6b6b61",
          600: "#54544c",
          700: "#43433d",
          800: "#363632",
          900: "#1f1f1c",
        },
        sand: {
          50: "#fdfcf9",
          100: "#f7f4ec",
          200: "#ede7d7",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,20,18,0.04), 0 8px 24px -8px rgba(20,20,18,0.08)",
        ring: "0 0 0 4px rgba(58,145,99,0.15)",
      },
    },
  },
  plugins: [],
};
