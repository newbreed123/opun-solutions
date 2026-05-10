/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Navy + Electric Blue + Cyan identity
        "dark-bg": "#071024",
        "dark-secondary": "#111827",
        "dark-tertiary": "#0B1020",
        "dark-deep": "#081120",
        "dark-card": "rgba(15, 23, 42, 0.82)",
        "dark-border": "rgba(59, 130, 246, 0.28)",
        "brand-blue": "#3B82F6",
        "brand-blue-dark": "#2563EB",
        "brand-blue-light": "#60A5FA",
        "brand-cyan": "#06B6D4",
        "text-primary": "#F8FAFC",
        "text-secondary": "#CBD5E1",
        "text-muted": "#94A3B8",
      },
      backgroundColor: {
        primary: "#071024",
        secondary: "#111827",
        surface: "#0B1020",
        card: "rgba(15, 23, 42, 0.82)",
        accent: "#3B82F6",
        cyan: "#06B6D4",
        deep: "#081120",
      },
      textColor: {
        primary: "#F8FAFC",
        secondary: "#CBD5E1",
        muted: "#94A3B8",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
      spacing: {
        "section-sm": "2rem",
        "section-md": "4rem",
        "section-lg": "6rem",
      },
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(2, 8, 23, 0.2)",
        md: "0 10px 30px rgba(2, 8, 23, 0.24)",
        lg: "0 20px 54px rgba(2, 8, 23, 0.3)",
        xl: "0 32px 72px rgba(2, 8, 23, 0.36)",
        "2xl": "0 44px 110px rgba(2, 8, 23, 0.42)",
        glow: "0 10px 30px rgba(59, 130, 246, 0.35), 0 0 28px rgba(6, 182, 212, 0.18)",
        "card-glow": "0 24px 70px rgba(2, 8, 23, 0.38), 0 0 42px rgba(59, 130, 246, 0.18)",
        inner: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in",
        slideInUp: "slideInUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInUp: {
          "0%": { transform: "translateY(1rem)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
