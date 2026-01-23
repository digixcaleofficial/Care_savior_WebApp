/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // 👈 Font set kiya
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // 👇 TERA BRAND COLORS (Screenshots se match kiya hua)
        primary: {
          DEFAULT: "#0066CC", // Logo Royal Blue
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#28A745", // Logo Green
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#FF4D4D", // Emergency Red
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#F1F5F9", // Cards ke piche ka light grey
          foreground: "#64748B",
        },
        accent: {
            DEFAULT: "#E6F0FA", // Light Blue tint (Hover effects ke liye)
            foreground: "#0066CC",
        },
        // Shadcn Defaults
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}