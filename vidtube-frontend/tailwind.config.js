/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Premium dark slate with sky blue accents
        background: {
          DEFAULT: "#080b12",
          secondary: "#0f1319",
          tertiary: "#161d2a",
        },
        surface: {
          DEFAULT: "rgba(20, 27, 38, 0.85)",
          hover: "rgba(28, 37, 50, 0.95)",
          active: "rgba(38, 48, 65, 0.98)",
        },
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c3d66",
        },
        accent: {
          blue: "#3b82f6",
          cyan: "#06b6d4",
          purple: "#a855f7",
          pink: "#ec4899",
        },
        text: {
          primary: "#f8fafc",
          secondary: "rgba(241, 245, 250, 0.8)",
          tertiary: "rgba(203, 213, 225, 0.65)",
          muted: "rgba(148, 163, 184, 0.48)",
        },
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(6, 182, 212, 0.12) 100%)",
        "glass-gradient-hover":
          "linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(6, 182, 212, 0.18) 100%)",
        "liquid-lux":
          "radial-gradient(circle at 20% 10%, rgba(14, 165, 233, 0.18) 0%, transparent 45%), radial-gradient(circle at 88% 8%, rgba(6, 182, 212, 0.14) 0%, transparent 40%)",
      },
      backdropBlur: {
        xs: "4px",
      },
      boxShadow: {
        glass: "0 20px 40px rgba(0, 0, 0, 0.35)",
        "glass-lg": "0 28px 60px rgba(0, 0, 0, 0.45)",
        glow: "0 14px 32px rgba(14, 165, 233, 0.25)",
        "glow-blue": "0 14px 32px rgba(6, 182, 212, 0.22)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        "float": "float 3s ease-in-out infinite",
        "pulse-subtle": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
