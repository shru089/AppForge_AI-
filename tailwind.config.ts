/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        violet: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        indigo: {
          50: "#eef2ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        liquid: {
          red: "#DD403A",
          mustard: "#B8B42D",
          green: "#697A21",
          cream: "#FFFCE8",
          dark: "#3E363F",
          // Map the old names to the new colors so existing classes work, or just let them be overridden
          pink: "#DD403A",   // Red replaces Pink
          purple: "#B8B42D", // Mustard replaces Purple
          cyan: "#697A21",   // Green replaces Cyan
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-gradient": "linear-gradient(135deg, hsl(252 100% 69% / 0.15) 0%, hsl(210 100% 56% / 0.15) 50%, hsl(174 100% 41% / 0.15) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 1.5s infinite",
        "spin-slow": "spin 3s linear infinite",
        "blob": "blob 10s infinite alternate",
        "blob-spin": "blob 15s infinite alternate, spin 20s linear infinite",
        "liquid": "liquid 8s ease-in-out infinite alternate"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        blob: {
          "0%": { borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%" },
          "34%": { borderRadius: "70% 30% 50% 50% / 30% 30% 70% 70%" },
          "67%": { borderRadius: "100% 60% 60% 100% / 100% 100% 60% 60%" },
          "100%": { borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%" },
        },
        liquid: {
          "0%": { transform: "translateY(0) scale(1)", filter: "hue-rotate(0deg)" },
          "50%": { transform: "translateY(-20px) scale(1.05)", filter: "hue-rotate(30deg)" },
          "100%": { transform: "translateY(0) scale(1)", filter: "hue-rotate(0deg)" }
        }
      },
      boxShadow: {
        glow: "0 0 20px hsl(252 100% 69% / 0.3)",
        "glow-lg": "0 0 40px hsl(252 100% 69% / 0.4)",
        glass: "0 8px 32px rgba(0,0,0,0.3)",
        liquid: "0 10px 40px rgba(121, 40, 202, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)",
      },
      backdropBlur: {
        xs: "2px",
        liquid: "20px"
      },
    },
  },
  plugins: [],
};
