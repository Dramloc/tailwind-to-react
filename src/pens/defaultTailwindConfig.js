export const defaultTailwindConfig = `const colors = require("tailwindcss/colors");

module.exports = {
  darkMode: false,
  theme: {
    extend: {
      colors: {
        primary: colors.cyan,
      },
    },
  },
  variants: {},
  plugins: [],
};
`;
