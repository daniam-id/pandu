import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

// Design tokens mirror DESIGN.md. Colors use `hsl(var(--token))` pattern to
// enable runtime theming (light/dark) without rebuilding Tailwind.
// For v1 we embed the final hex values directly; v2 can migrate to HSL CSS vars.

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
          DEFAULT: '#f7faf3',
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
        map: {
          land: '#F8F9FA',
          water: '#A8D8EA',
          park: '#C7E9B0',
          building: '#ECEEF1',
          'road-arterial': '#FFFFFF',
          'road-local': '#F5F6F8',
          'road-highway': '#FFE08A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        hero: ['32px', { lineHeight: '1.1', fontWeight: '700' }],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '32px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
        md: '0 4px 6px -1px rgba(0,0,0,0.1)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
        marker: '0 2px 6px rgba(0,0,0,0.18)',
        'overlay-card': '0 10px 15px -3px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
