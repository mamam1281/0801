/** @type {import('tailwindcss').Config} */
module.exports = {  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./.storybook/**/*.{js,ts,jsx,tsx,mdx}",
    "./stories/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // CSS Variables 직접 참조 - 색상 시스템 (완전 동기화)
      colors: {
        // Top-level/Abstract Colors (from globals.css :root)
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        input: 'var(--input)',
        destructive: 'var(--destructive)',
        ring: 'var(--ring)',
        
        // Semantic Colors
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        warning: 'var(--color-warning)',
          // Special Purpose Colors
        'purple-primary': 'var(--color-purple-primary)', // Added for BottomNavigationBar
        'purple-secondary': 'var(--color-purple-secondary)', // Added for gradients
        'purple-tertiary': 'var(--color-purple-tertiary)', // Added for tertiary purple
        'accent-red': 'var(--color-accent-red)',
        'accent-amber': 'var(--color-accent-amber)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'neutral-light': 'var(--color-neutral-light)',
        'neutral-medium': 'var(--color-neutral-medium)',
        'neutral-dark': 'var(--color-neutral-dark)',
        
        // Brand Colors (Nested approach)
        'neon-purple': {
          '1': 'var(--neon-purple-1)',
          '2': 'var(--neon-purple-2)',
        },

        // Gacha Tier Colors
        'gacha-common': 'var(--gacha-common-color)',
        'gacha-rare': 'var(--gacha-rare-color)',
        'gacha-epic': 'var(--gacha-epic-color)',
        'gacha-legendary': 'var(--gacha-legendary-color)',
        // It's also possible to define them as nested objects if more shades are needed
        // e.g., gacha: { common: 'var(--gacha-common-color)', rare: ... }
      },

      // CSS Variables 직접 참조 - 간격 시스템 (완전 확장)
      spacing: {
        '0': 'var(--spacing-0)',
        '0.5': 'var(--spacing-0-5)',
        '1': 'var(--spacing-1)',
        '1.5': 'var(--spacing-1-5)',
        '2': 'var(--spacing-2)',
        '2.5': 'var(--spacing-2-5)',
        '3': 'var(--spacing-3)',
        '3.5': 'var(--spacing-3-5)',
        '4': 'var(--spacing-4)',
        '5': 'var(--spacing-5)',
        '6': 'var(--spacing-6)',
        '7': 'var(--spacing-7)',
        '8': 'var(--spacing-8)',
        '9': 'var(--spacing-9)',
        '10': 'var(--spacing-10)',
        '11': 'var(--spacing-11)',
        '12': 'var(--spacing-12)',
        '14': 'var(--spacing-14)',
        '16': 'var(--spacing-16)',
        '20': 'var(--spacing-20)',
        '24': 'var(--spacing-24)',
        '28': 'var(--spacing-28)',
        '32': 'var(--spacing-32)',
      },      // CSS Variables 직접 참조 - Border Radius (완전 동기화)
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        'full': 'var(--radius-full)',
        'btn': 'var(--btn-border-radius)',
        'btn-md': 'var(--btn-border-radius-md)',
        'btn-lg': 'var(--btn-border-radius-lg)',
        'section-card': 'var(--section-card-radius)',
      },      // CSS Variables 직접 참조 - 폰트 시스템 (모든 CSS 변수 사용)
      fontSize: {
        'xs': ['var(--font-size-xs)', { lineHeight: 'var(--line-height-xs)' }],
        'sm': ['var(--font-size-sm)', { lineHeight: 'var(--line-height-sm)' }],
        'base': ['var(--font-size-body)', { lineHeight: 'var(--line-height-body)' }],
        'lg': ['var(--font-size-lg)', { lineHeight: 'var(--line-height-lg)' }],
        'xl': ['var(--font-size-xl)', { lineHeight: 'var(--line-height-xl)' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-2xl)' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-3xl)' }],
        '4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-4xl)' }],
        'caption': ['var(--font-size-caption)', { lineHeight: 'var(--line-height-caption)' }],
        'body': ['var(--font-size-body)', { lineHeight: 'var(--line-height-body)' }],
        'h4': ['var(--font-size-h4)', { lineHeight: 'var(--line-height-heading)' }],
        'h3': ['var(--font-size-h3)', { lineHeight: 'var(--line-height-heading)' }],
        'h2': ['var(--font-size-h2)', { lineHeight: 'var(--line-height-heading)' }],
        'h1': ['var(--font-size-h1)', { lineHeight: 'var(--line-height-heading)' }],
        'token': ['var(--font-size-token)', { lineHeight: 'var(--line-height-base)' }],
        'h5': ['var(--font-size-h4)', { lineHeight: 'var(--line-height-heading)' }],
      },

      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },

      lineHeight: {
        base: 'var(--line-height-base)',
        tight: 'var(--line-height-tight)',
        caption: 'var(--line-height-caption)',
        body: 'var(--line-height-body)',
        heading: 'var(--line-height-heading)',
      },

      // CSS Variables 직접 참조 - 그림자 (모든 shadow 변수 포함)
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'focused-glow': 'var(--shadow-focused-glow)',
        'inner-sm': 'var(--shadow-inner-sm)',
        'error-glow': 'var(--shadow-error-glow)',
        'success-glow': 'var(--shadow-success-glow)',
        'card-default': 'var(--shadow-card-default)',
        'card-hover': 'var(--shadow-card-hover)',
        'neon-primary': 'var(--shadow-neon-primary)',
        'neon-hover': 'var(--shadow-neon-hover)',
        'glass-card': 'var(--shadow-glass-card)',
        'animated-default': 'var(--shadow-animated-default)',
        'animated-hover': 'var(--shadow-animated-hover)',
        'btn-default': 'var(--shadow-btn-default)',
        'btn-hover': 'var(--shadow-btn-hover)',
      },

      // CSS Variables 직접 참조 - 애니메이션
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'normal': 'var(--transition-normal)',
      },      // CSS Variables 직접 참조 - 레이아웃 크기 (완전 동기화)
      width: {
        'checkbox': 'var(--checkbox-size)',
        'layout': 'var(--layout-max-width)',
        'content-card': 'var(--content-card-size)',
        'mobile-content': 'var(--mobile-content-size)',
        'tabs-content': 'var(--tabs-content-max-width)',
      },

      height: {
        'checkbox': 'var(--checkbox-size)',
        'section-card': 'var(--section-card-height)',
        'mobile-section': 'var(--mobile-section-height)',
        'app-header-mobile': 'var(--app-header-height-mobile)',
        'app-header-desktop': 'var(--app-header-height-desktop)',
        'tabs-content': 'var(--tabs-content-min-height)',
        'tabs-content-mobile': 'var(--tabs-content-min-height-mobile)',
        'input-sm': 'var(--input-height-sm)',
        'input-md': 'var(--input-height-md)',
        'input-lg': 'var(--input-height-lg)',
        'btn-md': 'var(--btn-height-md)',
        'btn-lg': 'var(--btn-height-lg)',
        'btn-icon-sm': 'var(--btn-icon-sm)',
        'btn-icon-md': 'var(--btn-icon-md)',
        'btn-icon-lg': 'var(--btn-icon-lg)',
        'btn-icon-xl': 'var(--btn-icon-xl)',
      },

      // CSS Variables 직접 참조 - 최대 너비 (완전 동기화)
      maxWidth: {
        'modal-sm': 'var(--modal-max-width-sm)',
        'modal-md': 'var(--modal-max-width-md)',
        'modal-lg': 'var(--modal-max-width-lg)',
        'modal-xl': 'var(--modal-max-width-xl)',
        'layout': 'var(--layout-max-width)',
        'tabs-content': 'var(--tabs-content-max-width)',
      },

      // CSS Variables 직접 참조 - 최소 높이 (완전 동기화)
      minHeight: {
        'content-card': 'var(--content-card-size)',
        'mobile-content': 'var(--mobile-content-size)',
        'section-card': 'var(--section-card-height)',
        'mobile-section': 'var(--mobile-section-height)',
        'tabs-content': 'var(--tabs-content-min-height)',
        'tabs-content-mobile': 'var(--tabs-content-min-height-mobile)',
      },

      // CSS Variables 직접 참조 - 간격 (완전 동기화)
      gap: {
        'layout': 'var(--layout-gap)',
        'app-header-icon': 'var(--app-header-icon-gap)',
      },

      // CSS Variables 직접 참조 - 패딩 (완전 동기화)
      padding: {
        'layout': 'var(--layout-padding)',
        'mobile-layout': 'var(--mobile-layout-padding)',
        'section-card': 'var(--section-card-padding)',
        'content-card': 'var(--content-card-padding)',
        'tabs-content': 'var(--tabs-content-padding)',
        'tabs-content-mobile': 'var(--tabs-content-padding-mobile)',
        'app-header-y': 'var(--app-header-padding-y)',
        'container-x': 'var(--container-padding-x)',
        'container-x-mobile': 'var(--container-padding-x-mobile)',
      },

      // CSS Variables 직접 참조 - 아이콘 크기 (완전 동기화)
      size: {
        'icon-xs': 'var(--icon-xs)',
        'icon-sm': 'var(--icon-sm)',
        'icon-md': 'var(--icon-md)',
        'icon-lg': 'var(--icon-lg)',
        'icon-xl': 'var(--icon-xl)',
        'icon-xxl': 'var(--icon-xxl)',
        'content-icon': 'var(--content-icon-size)',
        'mobile-content-icon': 'var(--mobile-content-icon)',
        'checkbox': 'var(--checkbox-size)',
      },

      // CSS Variables 직접 참조 - 브레이크포인트
      screens: {
        'sm': 'var(--breakpoint-mobile-sm)',   // 480px
        'md': 'var(--breakpoint-mobile-lg)',   // 768px  
        'lg': 'var(--breakpoint-tablet)',      // 1024px
        'xl': 'var(--breakpoint-xl)',          // 1280px
        '2xl': 'var(--breakpoint-2xl)',        // 1536px
      },      // 그라데이션 배경 (완전 동기화)
      backgroundImage: {
        'gradient-purple-primary': 'var(--gradient-purple-primary)',
        'gradient-purple-secondary': 'var(--gradient-purple-secondary)',
        'gradient-neon': 'var(--gradient-neon)',
      },

      // 애니메이션
      animation: {
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'blob': 'move-blob 10s infinite alternate',
      },

      keyframes: {
        'neon-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 5px var(--neon-purple-1), 0 0 10px var(--neon-purple-1), 0 0 15px var(--neon-purple-1)'
          },
          '50%': { 
            boxShadow: '0 0 10px var(--neon-purple-1), 0 0 20px var(--neon-purple-1), 0 0 30px var(--neon-purple-1)'
          }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'glow': {
          '0%, 100%': { 
            filter: 'brightness(1) drop-shadow(0 0 5px currentColor)' 
          },
          '50%': { 
            filter: 'brightness(1.2) drop-shadow(0 0 15px currentColor)' 
          }
        },
        'move-blob': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '50%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '75%': { transform: 'translate(50px, 10px) scale(1.05)' },
          '100%': { transform: 'translate(0, 0) scale(1)' }
        }      },
    },
    // 그레디언트 배경
    backgroundImage: {
      'gradient-purple-primary': 'var(--gradient-purple-primary)',
      'gradient-purple-secondary': 'var(--gradient-purple-secondary)',
      'gradient-accent': 'var(--gradient-accent)',
      'gradient-dark': 'var(--gradient-dark)',
      'gradient-neon': 'var(--gradient-neon)',
    },
  },
  plugins: [],
}
