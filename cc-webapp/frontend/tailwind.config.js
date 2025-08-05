/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Casino Club F2P 커스텀 테마
      colors: {
        neon: {
          blue: '#00f5ff',
          purple: '#b347d9',
          green: '#39ff14',
          pink: '#ff10f0',
          yellow: '#ffff00'
        },
        cyber: {
          dark: '#0a0a0a',
          medium: '#1a1a1a',
          light: '#2a2a2a'
        }
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite alternate',
        'cyber-glow': 'cyberGlow 3s ease-in-out infinite',
        'slot-spin': 'slotSpin 1s ease-out',
      },
      keyframes: {
        neonPulse: {
          'from': { textShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          'to': { textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' }
        },
        cyberGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 245, 255, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 245, 255, 0.8), 0 0 30px rgba(0, 245, 255, 0.6)' }
        },
        slotSpin: {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(360deg)' }
        }
      }
    },
  },
  plugins: [],
}
