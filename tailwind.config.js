module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#007AFF', // Your active tab color
          600: '#0062cc',
          700: '#004999',
          800: '#003166',
          900: '#001833',
        },
        secondary: {
          DEFAULT: '#34C759', // Success green
        },
        neutral: {
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#8E8E93', // Your inactive tab color
          600: '#737373',
          700: '#525252',
          800: '#262626',
          900: '#171717',
        },
        danger: '#FF3B30',
        warning: '#FFCC00',
        info: '#5AC8FA',
      },
      fontFamily: {
        sans: ['System'],
        heading: ['System-Bold'],
      },
    },
  },
};