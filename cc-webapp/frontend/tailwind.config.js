/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 CSS 변수 기반 색상
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: '#e6005e',
          foreground: '#ffffff',
          hover: '#cc0054',
          light: '#ff4d9a',
          dark: '#b30048'
        },
        secondary: {
          DEFAULT: '#2d2d3a',
          foreground: '#ffffff',
          hover: '#3d3d4a'
        },
        muted: {
          DEFAULT: '#2d2d3a',
          foreground: '#999999'
        },
        accent: {
          DEFAULT: '#e6005e',
          foreground: '#ffffff'
        },
        destructive: {
          DEFAULT: '#e6336b',
          foreground: '#ffffff'
        },
        border: {
          DEFAULT: 'rgba(230, 0, 94, 0.12)',
          secondary: 'rgba(255, 255, 255, 0.06)'
        },
        input: {
          DEFAULT: '#1a1a24',
          background: '#2d2d3a',
          border: 'rgba(230, 0, 94, 0.15)'
        },
        ring: 'rgba(230, 0, 94, 0.25)',
        
        // 🎮 게임 특화 색상 (하드코딩)
        gold: {
          DEFAULT: '#e6c200',
          light: '#f5d700',
          dark: '#cc9e00',
          soft: 'rgba(230, 194, 0, 0.08)'
        },
        // ⚡ 상태 색상 (하드코딩)
        success: {
          DEFAULT: '#9c4dcc',
          foreground: '#ffffff',
          soft: 'rgba(156, 77, 204, 0.08)'
        },
        warning: {
          DEFAULT: '#e89900',
          foreground: '#000000',
          soft: 'rgba(232, 153, 0, 0.08)'
        },
        error: {
          DEFAULT: '#e6336b',
          foreground: '#ffffff',
          soft: 'rgba(230, 51, 107, 0.08)'
        },
        info: {
          DEFAULT: '#4d9fcc',
          foreground: '#ffffff',
          soft: 'rgba(77, 159, 204, 0.08)'
        },
      },
        silver: {
          DEFAULT: 'var(--silver)',
          light: 'var(--silver-light)',
          dark: 'var(--silver-dark)',
          soft: 'var(--silver-soft)'
        },
        bronze: {
          DEFAULT: 'var(--bronze)',
          light: 'var(--bronze-light)',
          dark: 'var(--bronze-dark)',
          soft: 'var(--bronze-soft)'
        },
        emerald: {
          DEFAULT: 'var(--emerald)',
          light: 'var(--emerald-light)',
          dark: 'var(--emerald-dark)',
          soft: 'var(--emerald-soft)'
        },
        sapphire: {
          DEFAULT: 'var(--sapphire)',
          light: 'var(--sapphire-light)',
          dark: 'var(--sapphire-dark)',
          soft: 'var(--sapphire-soft)'
        },
        ruby: {
          DEFAULT: 'var(--ruby)',
          light: 'var(--ruby-light)',
          dark: 'var(--ruby-dark)',
          soft: 'var(--ruby-soft)'
        },
        // 추가 색상
        sky: {
          DEFAULT: 'var(--sky)',
          light: 'var(--sky-light)',
          dark: 'var(--sky-dark)',
          soft: 'var(--sky-soft)'
        },
        grass: {
          DEFAULT: 'var(--grass)',
          light: 'var(--grass-light)',
          dark: 'var(--grass-dark)',
          soft: 'var(--grass-soft)'
        },
        flame: {
          DEFAULT: 'var(--flame)',
          light: 'var(--flame-light)',
          dark: 'var(--flame-dark)',
          soft: 'var(--flame-soft)'
        },
        smoke: {
          DEFAULT: 'var(--smoke)',
          light: 'var(--smoke-light)',
          dark: 'var(--smoke-dark)',
          soft: 'var(--smoke-soft)'
        },
        // 상태 색상
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
          hover: 'var(--success-hover)',
          light: 'var(--success-light)',
          dark: 'var(--success-dark)',
          soft: 'var(--success-soft)'
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
          hover: 'var(--warning-hover)',
          light: 'var(--warning-light)',
          dark: 'var(--warning-dark)',
          soft: 'var(--warning-soft)'
        },
        error: {
          DEFAULT: 'var(--error)',
          foreground: 'var(--error-foreground)',
          hover: 'var(--error-hover)',
          light: 'var(--error-light)',
          dark: 'var(--error-dark)',
          soft: 'var(--error-soft)'
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
          hover: 'var(--info-hover)',
          light: 'var(--info-light)',
          dark: 'var(--info-dark)',
          soft: 'var(--info-soft)'
        },
      },
    },
  },
  plugins: [],
}

module.exports = config;
