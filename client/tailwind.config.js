/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a1a2e',
          50: '#f2f2f5',
          100: '#e6e6eb',
          200: '#cccccc',
          300: '#b3b3b8',
          400: '#80808a',
          500: '#4d4d5c',
          600: '#333342',
          700: '#262638',
          800: '#1a1a2e',
          900: '#151525',
          950: '#0b0b13',
        },
        gold: {
          DEFAULT: '#c9a84c',
          50: '#f9f6f0',
          100: '#f4ede0',
          200: '#e9dbc1',
          300: '#dfc9a2',
          400: '#d4b684',
          500: '#c9a84c',
          600: '#a1863d',
          700: '#79652e',
          800: '#50431e',
          900: '#28220f',
        },
        brand: {
          bg: '#f8f7f4',
          surface: '#ffffff',
          muted: '#6b7280',
          success: '#16a34a',
          error: '#dc2626',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:  ['"Montserrat"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.8' },
        },
      },
      transitionDuration: {
        '200': '200ms',
      }
    },
  },
  plugins: [],
}
