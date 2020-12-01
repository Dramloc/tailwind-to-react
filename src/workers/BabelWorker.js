// @ts-check
import { transformAsync } from "@babel/core";
import babelPresetReact from "@babel/preset-react";
import autoprefixer from "autoprefixer";
import hash from "object-hash";
import postcss from "postcss";
import corePlugins from "tailwindcss/lib/corePlugins";
import applyImportantConfiguration from "tailwindcss/lib/lib/applyImportantConfiguration";
import convertLayerAtRulesToControlComments from "tailwindcss/lib/lib/convertLayerAtRulesToControlComments";
import evaluateTailwindFunctions from "tailwindcss/lib/lib/evaluateTailwindFunctions";
import substituteClassApplyAtRules from "tailwindcss/lib/lib/substituteClassApplyAtRules";
import substituteResponsiveAtRules from "tailwindcss/lib/lib/substituteResponsiveAtRules";
import substituteScreenAtRules from "tailwindcss/lib/lib/substituteScreenAtRules";
import substituteTailwindAtRules from "tailwindcss/lib/lib/substituteTailwindAtRules";
import substituteVariantsAtRules from "tailwindcss/lib/lib/substituteVariantsAtRules";
import cloneNodes from "tailwindcss/lib/util/cloneNodes";
import getAllConfigs from "tailwindcss/lib/util/getAllConfigs";
import processPlugins from "tailwindcss/lib/util/processPlugins";
import resolveConfig from "tailwindcss/resolveConfig";
import macrosPlugin from "../codemods/babelPluginMacros";
import { convertComponent } from "../codemods/convertComponent";
import { generateImports } from "../codemods/generateImports";
import twinMacro, { getTheme, globalStyles } from "../codemods/twinMacro";

/** @type {(options: import("../codemods/convertComponent").ConvertComponentOptions) => Promise<string>} */
export const convert = async (options) => {
  const { code } = await convertComponent(options);
  return code;
};

/** @typedef {{ code: string, tailwindConfig: string, preset: import("../codemods/convertComponent").TailwindToReactPreset }} GeneratePreviewOptions */
/** @typedef {{ js: string, css: string }} PreviewPayload */

/** @type {(tailwindConfig: string) => Promise<object>} */
const parseTailwindConfig = async (tailwindConfig) => {
  // eslint-disable-next-line no-eval
  return eval(`(async () => { ${tailwindConfig} })()`);
};

/** @type {(options: GeneratePreviewOptions) => Promise<string>} */
const compileJS = async ({ code, tailwindConfig, preset }) => {
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
}`;

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
            tailwindConfig: await parseTailwindConfig(tailwindConfig),
          },
        },
      ],
    ].filter(Boolean),
  });

  return js;
};

const getConfigFunction = (config) => () => {
  return resolveConfig([...getAllConfigs(config)]);
};

let previousConfig = null;
let processedPlugins = null;
let getProcessedPlugins = null;

const processTailwindFeatures = (getConfig) => {
  return function (css) {
    const config = getConfig();
    const configChanged = hash(previousConfig) !== hash(config);
    previousConfig = config;

    if (configChanged) {
      processedPlugins = processPlugins(
        [
          ...corePlugins({
            ...config,
            corePlugins: {
              ...config.corePlugins,
              preflight: false,
            },
          }),
          ...(config.plugins || []),
        ],
        config
      );

      getProcessedPlugins = function () {
        return {
          ...processedPlugins,
          base: cloneNodes(processedPlugins.base),
          components: cloneNodes(processedPlugins.components),
          utilities: cloneNodes(processedPlugins.utilities),
        };
      };
    }

    return postcss([
      substituteTailwindAtRules(config, getProcessedPlugins()),
      evaluateTailwindFunctions(config),
      substituteVariantsAtRules(config, getProcessedPlugins()),
      substituteResponsiveAtRules(config),
      convertLayerAtRulesToControlComments(),
      substituteScreenAtRules(config),
      substituteClassApplyAtRules(config, getProcessedPlugins, configChanged),
      applyImportantConfiguration(config),
    ]).process(css, { from: undefined });
  };
};

/** @type {(options: GeneratePreviewOptions) => Promise<string>} */
const compileCSS = async ({ code, tailwindConfig: rawTailwindConfig, preset }) => {
  const tailwindConfig = await parseTailwindConfig(rawTailwindConfig);
  if (preset === "twin.macro") {
    const theme = getTheme(tailwindConfig.theme);
    const styles = globalStyles.map((globalFunction) => globalFunction({ theme })).join("\n");
    return styles;
  }
  // @ts-ignore
  const { css } = await postcss([
    {
      postcssPlugin: "tailwindcss",
      plugins: [processTailwindFeatures(getConfigFunction(tailwindConfig))],
    },
    autoprefixer(),
  ]).process("@tailwind base;\n@tailwind components;\n@tailwind utilities;\n", {
    from: undefined,
  });
  return css;
};

/** @type {(options: GeneratePreviewOptions) => Promise<PreviewPayload>} */
export const generatePreview = async (options) => {
  const [js, css] = await Promise.all([compileJS(options), compileCSS(options)]);
  return { js, css };
};
