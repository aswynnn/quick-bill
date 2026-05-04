import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
      },
      colors: {
        cream: '#FAF9F6',
        ink: {
          DEFAULT: '#0D0D0D',
          2: '#3A3A3A',
          3: '#6B6B6B',
        },
        border: {
          DEFAULT: '#E4E2DC',
          2: '#D0CEC7',
        },
      },
    },
  },
  plugins: [],
}
export default config
