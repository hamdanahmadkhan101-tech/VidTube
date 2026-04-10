/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Deep slate base with refined blue/cyan accents
        background: {
          DEFAULT: "#090f17",
          secondary: "#101927",
          tertiary: "#182335",
        },
        surface: {
          DEFAULT: "rgba(22, 33, 49, 0.72)",
          hover: "rgba(31, 45, 67, 0.84)",
          active: "rgba(40, 58, 86, 0.92)",
        },
        primary: {
          50: "#eef8ff",
          100: "#d6edff",
          200: "#aedbff",
          300: "#7ec3ff",
          400: "#49a7ff",
          500: "#1f8fff",
          600: "#0d76de",
          700: "#0b60b5",
          800: "#0f4d8f",
          900: "#113f74",
        },
        accent: {
          blue: "#43b8ff",
          cyan: "#14d3c6",
          purple: "#4f6eff",
          pink: "#ff6f9d",
        },
        text: {
          primary: "#f7fbff",
          secondary: "rgba(232, 241, 255, 0.78)",
          tertiary: "rgba(198, 214, 235, 0.58)",
          muted: "rgba(168, 189, 216, 0.42)",
        },
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(135deg, rgba(67, 184, 255, 0.16) 0%, rgba(20, 211, 198, 0.12) 100%)",
        "glass-gradient-hover":
          "linear-gradient(135deg, rgba(67, 184, 255, 0.26) 0%, rgba(20, 211, 198, 0.2) 100%)",
        "liquid-lux":
          "radial-gradient(circle at 20% 10%, rgba(67, 184, 255, 0.2) 0%, transparent 45%), radial-gradient(circle at 88% 8%, rgba(20, 211, 198, 0.16) 0%, transparent 40%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 20px 42px rgba(2, 8, 20, 0.45)",
        "glass-lg": "0 28px 64px rgba(2, 8, 20, 0.58)",
        glow: "0 14px 30px rgba(31, 143, 255, 0.35)",
        "glow-blue": "0 14px 30px rgba(20, 211, 198, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
