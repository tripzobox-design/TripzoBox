/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F9058',
          hover: '#0c7547',
          dark: '#095c37',
          light: '#e6f7ef',
        },
        secondary: {
          DEFAULT: '#34C759',
          hover: '#2eb34f',
          light: '#eaf9ee',
        },
        accent: {
          DEFAULT: '#A1F3D0',
          hover: '#87e9be',
          light: '#E6FAF1',
        },
        text: {
          DEFAULT: '#1F2037',
          muted: '#636A80',
          subtle: '#8F95A5',
        },
        'light-bg': '#F8FAF9',
        border: {
          DEFAULT: '#E5E9E7',
          subtle: '#EEF2F0',
        }
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'card': '0 4px 20px -2px rgba(31, 32, 55, 0.05), 0 2px 6px -1px rgba(31, 32, 55, 0.03)',
        'hover': '0 10px 25px -3px rgba(15, 144, 88, 0.12), 0 4px 6px -2px rgba(31, 32, 55, 0.05)',
        'float': '0 20px 35px -5px rgba(31, 32, 55, 0.08), 0 10px 10px -5px rgba(31, 32, 55, 0.04)',
      }
    },
  },
  plugins: [],
}
