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
        // Dark mode palette
        "dark-bg": "#0A0E27",
        "dark-secondary": "#1a1f3a",
        "dark-tertiary": "#2d3147",
        "brand-blue": "#0066FF",
        "brand-blue-dark": "#0052CC",
        "brand-blue-light": "#3D8FFF",
      },
      backgroundColor: {
        primary: "#0A0E27",
        secondary: "#1a1f3a",
        accent: "#0066FF",
      },
      textColor: {
        primary: "#FFFFFF",
        secondary: "#b4b9c4",
        muted: "#8a8f9a",
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
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
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
