/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        secondary: {
          DEFAULT: '#a855f7',
          dark: '#9333ea',
        },
        dark: {
          DEFAULT: '#1a1b26',
          lighter: '#1f2937',
          light: '#374151',
        },
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        glow: {
          '0%': {
            'box-shadow': '0 0 5px #6366f1, 0 0 10px #6366f1, 0 0 15px #6366f1',
          },
          '100%': {
            'box-shadow': '0 0 10px #6366f1, 0 0 20px #6366f1, 0 0 30px #6366f1',
          },
        },
      },
    },
  },
  // Add the plugins section here
  plugins: [
    require('@tailwindcss/typography'), // For Markdown-like content styling
  ],
};