import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        brand: {
          primary: '#085427',
          'primary-hover': '#06401E',
          accent: '#8CE363',
          'accent-hover': '#71C64B',
        },
        surface: {
          DEFAULT: '#F9F9F9',
          offset: '#E5E7EB',
        },
        border: {
          DEFAULT: '#E5E7EB',
        },
        text: {
          primary: '#111827',
          muted: '#6B7280',
          faint: '#9CA3AF',
          inverse: '#FFFFFF',
        },
        status: {
          success: '#8CE363',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '32px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
        md: '0 4px 6px -1px rgba(0,0,0,0.1)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
