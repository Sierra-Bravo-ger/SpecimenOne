/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: ['class', '.dark-theme'],
  theme: {
    extend: {
      colors: {
        gray: {
          '850': '#1a1a1e'
        }
      },
      colors: {
        primary: '#6abf7b',
        'primary-dark': '#83d991',
        surface: '#FFFBFE',
        'surface-dark': '#1C1B1F',
        background: '#F5F5F5',
        'background-dark': '#121212',
        'on-surface': '#1C1B1F',
        'on-surface-dark': '#E6E1E5',
      },      animation: {
        'fadeIn': 'fadeIn 0.3s ease',
        'slideIn': 'slideIn 0.3s ease',
        'slideOut': 'slideOut 0.3s ease',
        'themeTransition': 'themeTransition 0.5s ease',
        'dropdown-fade-in': 'dropdownFadeIn 0.2s ease forwards',
      },      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(20px)', opacity: '0' },
        },
        themeTransition: {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '1' },
        },
        dropdownFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        '400': '400ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'theme': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

