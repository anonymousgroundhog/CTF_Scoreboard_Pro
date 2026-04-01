import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0e1a',
          surface: '#0f1623',
          border: '#1e2d4a',
          accent: '#00d4ff',
          green: '#00ff88',
          red: '#ff3b3b',
          yellow: '#ffc300',
          muted: '#4a5568',
          text: '#c8d6e8',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        cyber: '0 0 12px rgba(0, 212, 255, 0.15)',
        glow: '0 0 24px rgba(0, 212, 255, 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
