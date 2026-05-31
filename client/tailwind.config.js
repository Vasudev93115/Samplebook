/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      },
      colors: {
        green: {
          DEFAULT: '#1a6b47',
          mid: '#2d9462',
          light: '#e8f5ee',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#2d9462',
          600: '#1a6b47',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        ink: {
          DEFAULT: '#111827',
          soft: '#374151',
          muted: '#6b7280'
        },
        paper: '#f3f4f6',
        card: '#ffffff',
        border: '#e5e7eb'
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 16px rgba(0,0,0,0.08)',
        lg: '0 8px 32px rgba(0,0,0,0.12)'
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px'
      }
    }
  },
  plugins: []
};
