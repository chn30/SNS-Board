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
        background: '#05050a',
        surface: 'rgba(255,255,255,0.03)',
        'surface-border': 'rgba(255,255,255,0.06)',
        primary: '#8b5cf6',
        'primary-pink': '#ec4899',
        accent: '#a78bfa',
        'text-primary': '#e2e8f0',
        'text-secondary': '#8892b0',
        'text-muted': '#64748b',
        hot: '#f87171',
        success: '#34d399',
        warning: '#fbbf24',
        'cat-free': 'rgba(139,92,246,0.15)',
        'cat-free-text': '#a78bfa',
        'cat-question': 'rgba(251,191,36,0.15)',
        'cat-question-text': '#fbbf24',
        'cat-info': 'rgba(52,211,153,0.15)',
        'cat-info-text': '#34d399',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '14px',
        xl: '16px',
      },
      keyframes: {
        'hot-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(248,113,113,0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(248,113,113,0.8)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'hot-glow': 'hot-glow 2s infinite',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
