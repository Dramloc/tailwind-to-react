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

const tailwindConfigForms = `const colors = require("tailwindcss/colors");

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
  plugins: [require("@tailwindcss/forms")],
};
`;

/** @type {import("./ExampleQueries").Example[]} */
export const examples = [
  {
    slug: "welcome",
    name: "Welcome",
    load: async () => ({
      html: (await import("raw-loader!./welcome.html")).default,
      tailwindConfig: defaultTailwindConfig,
    }),
  },
  {
    slug: "hero",
    name: "Hero",
    load: async () => ({
      html: (await import("raw-loader!./hero.html")).default,
      tailwindConfig: defaultTailwindConfig,
    }),
  },
  {
    slug: "header",
    name: "Header",
    load: async () => ({
      html: (await import("raw-loader!./header.html")).default,
      tailwindConfig: defaultTailwindConfig,
    }),
  },
  {
    slug: "stacked-layout",
    name: "Stacked Layout",
    load: async () => ({
      html: (await import("raw-loader!./stacked-layout.html")).default,
      tailwindConfig: defaultTailwindConfig,
    }),
  },
  {
    slug: "slide-over",
    name: "Slide-Over",
    load: async () => ({
      html: (await import("raw-loader!./slide-over.html")).default,
      tailwindConfig: defaultTailwindConfig,
    }),
  },
  {
    slug: "tailwindcss-forms",
    name: "@tailwindcss/forms",
    load: async () => ({
      html: (await import("raw-loader!./forms.html")).default,
      tailwindConfig: tailwindConfigForms,
    }),
  },
];
