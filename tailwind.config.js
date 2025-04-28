/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: ['class', '.dark-theme'],
  theme: {
    extend: {      colors: {
        gray: {
          '850': '#1a1a1e'
        },
        // Primärfarben für beide Themes
        primary: {
          DEFAULT: '#6abf7b',
          dark: '#83d991',
        },
        // Oberflächen- und Hintergrundfarben
        surface: {
          DEFAULT: '#FFFBFE',
          dark: '#1C1B1F',
        },
        background: {
          DEFAULT: '#F5F5F5',
          dark: '#121212',
        },
        // Text- und Oberflächentext
        'on-surface': {
          DEFAULT: '#1C1B1F',
          dark: '#E6E1E5',
        },
      },animation: {
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

