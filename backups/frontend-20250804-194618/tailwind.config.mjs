/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./styles/globals.css",
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        // Primary theme
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
          soft: "var(--primary-soft)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
          hover: "var(--secondary-hover)",
        },
        // Game colors
        gold: {
          DEFAULT: "var(--gold)",
          foreground: "var(--gold-foreground)",
          light: "var(--gold-light)",
          dark: "var(--gold-dark)",
          soft: "var(--gold-soft)",
        },
        // Status colors
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
          soft: "var(--success-soft)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
          soft: "var(--warning-soft)",
        },
        error: {
          DEFAULT: "var(--error)",
          foreground: "var(--error-foreground)",
          soft: "var(--error-soft)",
        },
        info: {
          DEFAULT: "var(--info)",
          foreground: "var(--info-foreground)",
          soft: "var(--info-soft)",
        },
        // UI elements
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        // Borders and inputs
        border: "var(--border)",
        "border-secondary": "var(--border-secondary)",
        input: "var(--input)",
        "input-background": "var(--input-background)",
        "input-border": "var(--input-border)",
        "switch-background": "var(--switch-background)",
        ring: "var(--ring)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        game: "var(--radius-game)",
        button: "var(--radius-button)",
      },
      boxShadow: {
        "soft-glow": "var(--soft-glow)",
        "gold-soft-glow": "var(--gold-soft-glow)",
        "shadow-soft": "var(--shadow-soft)",
        "shadow-colored-soft": "var(--shadow-colored-soft)",
        "shadow-elevated": "var(--shadow-elevated)",
        "metal-shadow-inset": "var(--metal-shadow-inset)",
        "metal-shadow-outset": "var(--metal-shadow-outset)",
      },
      backdropFilter: {
        "glass": "var(--glass-backdrop)",
        "glass-metal": "var(--glass-metal-backdrop)",
      },
      backgroundImage: {
        "gradient-game": "linear-gradient(135deg, #e6005e, #ff4d9a)",
        "gradient-gold": "linear-gradient(135deg, #e6c200, #f5d700)",
        "gradient-metal": "linear-gradient(135deg, #2d2d3a, #1a1a24, #2d2d3a)",
        "gradient-text-primary": "linear-gradient(135deg, #e6005e, #ff4d9a)",
        "gradient-text-gold": "linear-gradient(135deg, #e6c200, #f5d700)",
        "gradient-text-metal": "linear-gradient(135deg, #ffffff, #cccccc, #999999)",
      },
    },
  },
  plugins: [],
}
