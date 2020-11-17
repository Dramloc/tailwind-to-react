import { transformAsync } from "@babel/core";
import babelPresetReact from "@babel/preset-react";
import tailwindUIPlugin from "@tailwindcss/ui";
import defaultTheme from "tailwindcss/defaultTheme";
import macrosPlugin from "./codemods/babelPluginMacros";
import { generateImports } from "./codemods/generateImports";
import twinMacro from "./codemods/twinMacro";

const tailwindConfig = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        "light-blue": {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        "monaco-gray": {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
        },
      },
    },
  },
  dark: "class",
  plugins: [tailwindUIPlugin],
};

export const transform = async (input) => {
  const { code } = await transformAsync(
    `
${generateImports(input, { runtime: "classic" })}
import { hydrate, render } from "react-dom";

${input}

const rootElement = document.getElementById("root");
if (rootElement.hasChildNodes()) {
hydrate(<Component />, rootElement);
} else {
render(<Component />, rootElement);
}`,
    {
      presets: [
        [
          babelPresetReact,
          {
            pragma: "jsx",
            pragmaFrag: "Fragment",
            runtime: "classic",
          },
        ],
      ],
      plugins: [
        [
          macrosPlugin,
          {
            require: (id) => {
              if (id === "twin.macro") {
                return twinMacro;
              }
              throw new Error(`[babel-plugin-macros] require(${id}) not supported`);
            },
            resolvePath: (source) => {
              return source;
            },
            twin: {
              tailwindConfig,
            },
          },
        ],
      ],
    }
  );
  return code;
};
