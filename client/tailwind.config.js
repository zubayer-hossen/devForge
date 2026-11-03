/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Hind Siliguri"', '"Noto Sans Bengali"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        bn: ['"Hind Siliguri"', '"Noto Sans Bengali"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        navy: { 950: '#070b1a', 900: '#0b1020', 800: '#121935', 700: '#1a2350', 600: '#232c55', 500: '#33407a' },
        brand: { 300: '#b4a5ff', 400: '#9a85ff', 500: '#7c5cff', 600: '#6a46f0', 700: '#5836d1' },
        electric: { 400: '#5aa2ff', 500: '#3b82f6', 600: '#2563eb' },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c5cff 0%, #3b82f6 100%)',
        'hero-glow':
          'radial-gradient(60% 50% at 50% 0%, rgba(124,92,255,0.28) 0%, rgba(59,130,246,0.10) 45%, transparent 75%)',
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(124, 92, 255, 0.55)',
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px -12px rgba(15, 23, 42, 0.18)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      animation: { float: 'float 6s ease-in-out infinite' },
    },
  },
  plugins: [],
};
