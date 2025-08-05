/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  // 커스텀 클래스들이 항상 포함되도록 safelist 추가
  safelist: [
    'glass-effect',
    'glass-metal',
    'glass-metal-hover',
    'btn-hover-glow',
    'btn-hover-lift',
    'border-glow',
    'border-metal',
    'soft-glow',
    'text-gradient-primary',
    'text-gradient-gold',
    'bg-gradient-game',
    'metal-shine',
    'shadow-soft',
    'glass-metal-pressed',
    'card-hover-float'
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "700px",
      },
    },
    extend: {
      colors: {
        // 기본 색상
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        
        // 프라이머리 색상
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        'primary-hover': 'var(--primary-hover)',
        'primary-light': 'var(--primary-light)',
        'primary-dark': 'var(--primary-dark)',
        'primary-soft': 'var(--primary-soft)',
        
        // 세컨더리 색상
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        'secondary-hover': 'var(--secondary-hover)',
        
        // 골드/포인트 색상
        gold: 'var(--gold)',
        'gold-foreground': 'var(--gold-foreground)',
        'gold-light': 'var(--gold-light)',
        'gold-dark': 'var(--gold-dark)',
        'gold-soft': 'var(--gold-soft)',
        
        // 상태 색상
        success: 'var(--success)',
        'success-foreground': 'var(--success-foreground)',
        'success-soft': 'var(--success-soft)',
        warning: 'var(--warning)',
        'warning-foreground': 'var(--warning-foreground)',
        'warning-soft': 'var(--warning-soft)',
        error: 'var(--error)',
        'error-foreground': 'var(--error-foreground)',
        'error-soft': 'var(--error-soft)',
        info: 'var(--info)',
        'info-foreground': 'var(--info-foreground)',
        'info-soft': 'var(--info-soft)',
        
        // UI 요소 색상
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "spin-slow": "spin 6s linear infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-glow": {
          '0%, 100%': { boxShadow: '0 0 10px var(--primary), 0 0 20px var(--primary-light)' },
          '50%': { boxShadow: '0 0 5px var(--primary), 0 0 10px var(--primary-light)' },
        },
        "float": {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-game': 'linear-gradient(to right, var(--primary), var(--gold))',
        'gradient-glow': 'radial-gradient(circle at center, var(--primary-light), var(--primary-dark))',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'glow': 'var(--soft-glow)',
        'gold-glow': 'var(--gold-soft-glow)',
      },
      borderColor: {
        'metal': 'var(--glass-metal-border)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
