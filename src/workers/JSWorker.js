// @ts-check
import { transformAsync } from "@babel/core";
import babelPresetReact from "@babel/preset-react";
import macrosPlugin from "../codemods/babelPluginMacros";
import { convertComponent as _convertComponent } from "../codemods/convertComponent";
import { generateImports } from "../codemods/generateImports";
import twinMacro from "../codemods/twinMacro";
import { compileConfig } from "./compileConfig";

/** @typedef {(options: import("../codemods/convertComponent").ConvertComponentOptions) => Promise<string>} ConvertComponent */
/** @type {ConvertComponent} */
export const convertComponent = async (options) => {
  const { code } = await _convertComponent(options);
  return code;
};

/** @typedef {{ code: string, tailwindConfig: string, preset: import("../codemods/convertComponent").TailwindToReactPreset }} CompileJSOptions */
/** @typedef {(options: CompileJSOptions) => Promise<string>} CompileJS */
/** @type {CompileJS} */
export const compileJS = async ({ code, tailwindConfig, preset }) => {
  // Scaffold preview module
  const template = `
import { hydrate, render } from "https://cdn.skypack.dev/react-dom?min";
import { ErrorBoundary } from "https://cdn.skypack.dev/react-error-boundary?min";
${generateImports(code, { type: "cdn", preset })}

${code}

const App = () => {
  return (
    <ErrorBoundary
      fallback={<span>Error while rendering component</span>}
      onError={(error) => window.postMessage({ type: "PREVIEW_ERROR", payload: error })}
    >
      <Component />
    </ErrorBoundary>
  );
};

const rootElement = document.getElementById("root");
if (rootElement.hasChildNodes()) {
  hydrate(<App />, rootElement);
} else {
  render(<App />, rootElement);
}

window.postMessage({ type: "PREVIEW_SUCCESS" })
`;

  // Compile the preview module
  const { code: js } = await transformAsync(template, {
    presets: [
      [
        babelPresetReact,
        {
          runtime: "classic",
        },
      ],
    ],
    plugins: [
      // If the preset is twin.macro, apply babel-macros-plugin with twin.macro
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
            tailwindConfig: await compileConfig(tailwindConfig),
          },
        },
      ],
    ].filter(Boolean),
  });

  return js;
};
