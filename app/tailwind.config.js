/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        m3: {
          bg: '#131314',
          surface: '#131314',
          'surface-dim': '#131314',
          'surface-bright': '#37393B',
          'surface-lowest': '#0E0E0F',
          'surface-low': '#171819',
          'surface-container': '#1E1F20',
          'surface-container-high': '#282A2C',
          'surface-container-highest': '#333537',
          'surface-variant': '#444746',
          'on-surface-variant': '#C4C7C5',
          outline: '#8E918F',
          'outline-variant': '#444746',
          primary: '#A8C7FA',
          'on-primary': '#003258',
          'primary-container': '#004A77',
          'on-primary-container': '#C2E7FF',
          secondary: '#7FCFFF',
          'on-secondary': '#003355',
          'secondary-container': '#004A77',
          'on-secondary-container': '#C2E7FF',
          error: '#F2B8B5',
          'on-error': '#601410',
          'error-container': '#8C1D18',
          'on-error-container': '#F9DEDC',
          success: '#6DD58C',
          'on-success': '#003919',
          'success-container': '#005327',
          'on-success-container': '#8CF8A6',
        }
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      animation: {
        'fab-pulse': 'fabPulse 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate',
      },
      keyframes: {
        fabPulse: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.06)' },
        }
      }
    },
  },
  plugins: [],
}
