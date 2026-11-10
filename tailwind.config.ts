import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bia: {
          pink: {
            DEFAULT: '#F5DDE5',
            light: '#FAF0F4',
            dark: '#E7B5C6',
          },
          nude: {
            DEFAULT: '#E9D9CD',
            light: '#F4ECE6',
            dark: '#D5BEAC',
          },
          rosegold: {
            DEFAULT: '#C69A76',
            light: '#E5CBB7',
            dark: '#A67752',
          },
          gold: {
            DEFAULT: '#D4AF37',
            light: '#F3E5AB',
            dark: '#AA820A',
          },
          lilas: {
            DEFAULT: '#EDE5F3',
            light: '#F7F3FA',
            dark: '#D5C3E3',
          },
          offwhite: '#FAF7F8',
          white: '#FFFFFF',
          text: '#39313A',
          marsala: {
            DEFAULT: '#9C5B6F',
            light: '#B57488',
            dark: '#7A3F51',
          },
        },
      },
      fontFamily: {
        serif: ['Outfit', 'Montserrat', 'Plus Jakarta Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        sans: ['Montserrat', 'Plus Jakarta Sans', 'Outfit', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(156, 91, 111, 0.08)',
        'glow': '0 0 25px rgba(198, 154, 118, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
