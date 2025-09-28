/**** Tailwind Config ****/
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: 'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        accent: 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',
        destructive: 'var(--color-destructive)',
        'destructive-foreground': 'var(--color-destructive-foreground)',
        ring: 'var(--color-ring)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)'
        },
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#baddff',
          300: '#8cc7ff',
          400: '#55a6ff',
          500: '#247dff',
          600: '#0d5ff1',
          700: '#0648c7',
          800: '#083d9d',
          900: '#0c377d',
          950: '#071f45'
        }
      },
      boxShadow: {
        'sm-up': '0 1px 3px 0 rgba(0,0,0,0.06),0 1px 2px -1px rgba(0,0,0,0.05)',
        'focus': '0 0 0 3px rgba(36,125,255,0.45)'
      },
      borderRadius: {
        'xl': '1rem'
      }
    }
  }
};
