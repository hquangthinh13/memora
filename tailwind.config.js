/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-soft": "var(--color-surface-soft)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        "text-soft": "var(--color-text-soft)",
        border: "var(--color-border)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        mint: "var(--color-mint)",
        "mint-soft": "var(--color-mint-soft)",
        pink: "var(--color-pink)",
        "pink-soft": "var(--color-pink-soft)",
        peach: "var(--color-peach)",
        "peach-soft": "var(--color-peach-soft)",
        lavender: "var(--color-lavender)",
        "lavender-soft": "var(--color-lavender-soft)",
        "yellow-soft": "var(--color-yellow-soft)",
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        "sans-medium": "var(--font-sans-medium)",
        "sans-semibold": "var(--font-sans-semibold)",
        "sans-bold": "var(--font-sans-bold)",
      },
      spacing: {
        card: "var(--spacing-card)",
        "screen-x": "var(--spacing-screen-x)",
        "screen-y": "var(--spacing-screen-y)",
        "screen-gap": "var(--spacing-screen-gap)",
      },
    },
  },
  plugins: [],
};
