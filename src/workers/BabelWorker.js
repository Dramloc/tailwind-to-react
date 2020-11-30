import { transformAsync } from "@babel/core";
import babelPresetReact from "@babel/preset-react";
import macrosPlugin from "../codemods/babelPluginMacros";
import { convertComponent } from "../codemods/convertComponent";
import { generateImports } from "../codemods/generateImports";
import twinMacro from "../codemods/twinMacro";

const tailwindConfig = {};

/** @type {(options: import("../codemods/convertComponent").ConvertComponentOptions) => Promise<string>} */
export const convert = async (options) => {
  const { code } = await convertComponent(options);
  return code;
};

export const generatePreview = async (componentCode, preset) => {
  const template = `
${generateImports(componentCode, { type: "cdn", preset })}
import { hydrate, render } from "https://cdn.skypack.dev/react-dom?min";
import { ErrorBoundary } from "https://cdn.skypack.dev/react-error-boundary?min";

${componentCode}

const App = () => {
  return (
    <ErrorBoundary fallback={<span>Error while rendering component</span>} onError={(error) => window.postMessage({ type: "PREVIEW_ERROR", payload: error })}>
      <Component />
    </ErrorBoundary>
  );
};

const rootElement = document.getElementById("root");
if (rootElement.hasChildNodes()) {
  hydrate(<App />, rootElement);
} else {
  render(<App />, rootElement);
}`;
  const { code } = await transformAsync(template, {
    presets: [
      [
        babelPresetReact,
        {
          runtime: "classic",
        },
      ],
    ],
    plugins: [
      preset === "twin.macro" && [
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
    ].filter(Boolean),
  });
  return code;
};
