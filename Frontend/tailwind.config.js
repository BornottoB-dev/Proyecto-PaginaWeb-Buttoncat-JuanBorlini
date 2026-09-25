/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FFE600",
          yellowLight: "#FFF59D",
          purple: "#7E22CE",
          purpleBright: "#8B00FF",
          cyan: "#00F0FF",
          cyanLight: "#E0F7FA",
          pink: "#FF007F",
          orange: "#FF5E00",
          dark: "#121212",
          grayLight: "#F3F4F6",
        }
      },
      boxShadow: {
        brutal: '4px 4px 0px #000000',
        'brutal-lg': '6px 6px 0px #000000',
        'brutal-xl': '8px 8px 0px #000000',
        'brutal-sm': '2px 2px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Space Grotesk', 'sans-serif'],
        sedgwick: ['"Sedgwick Ave"', '"Sedgwick Ave Display"', 'cursive', 'sans-serif'],
        henny: ['"Henny Penny"', 'cursive', 'sans-serif'],
        coraline: ['"Sedgwick Ave"', '"Sedgwick Ave Display"', '"Jolly Lodger"', '"Jim Nightshade"', '"Griffy"', '"Pirata One"', '"Almendra Display"', 'cursive', 'serif'],
      }
    },
  },
  plugins: [],
}


