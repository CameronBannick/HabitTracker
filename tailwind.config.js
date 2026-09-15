/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#040810',
        accent: '#1E7FFF',
        'accent-dim': 'rgba(30,127,255,0.18)',
        'accent-label': '#3A7FCC',
      },
      animation: {
        'fill-bar': 'fillBar 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fillBar: {
          from: { width: '0%' },
          to: { width: 'var(--bar-width)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
