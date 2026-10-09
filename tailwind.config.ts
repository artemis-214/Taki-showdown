import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#080A12',
        panel: {
          dark: '#101322',
          raised: '#171A2B',
        },
        arcade: {
          magenta: '#FF4DB8',
          cyan: '#55E7FF',
          green: '#79FF8B',
          amber: '#FFCF56',
          red: '#FF4D6D',
          steel: '#777E9C',
          text: '#F5F7FF',
        },
      },
      fontFamily: {
        arcade: ['var(--font-press-start)', 'monospace'],
        retro: ['var(--font-vt323)', 'monospace'],
      },
      boxShadow: {
        pixel: '4px 4px 0px 0px #000000',
        'pixel-sm': '2px 2px 0px 0px #000000',
        'pixel-lg': '6px 6px 0px 0px #000000',
        'neon-cyan': '0 0 10px rgba(85, 231, 255, 0.6)',
        'neon-magenta': '0 0 10px rgba(255, 77, 184, 0.6)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.25s ease-in-out',
      },
    },
  },
  plugins: [],
};
export default config;
