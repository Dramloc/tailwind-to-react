// @ts-check
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
import processPlugins from "tailwindcss/lib/util/processPlugins";
import resolveConfig from "tailwindcss/resolveConfig";
import {
  convertCssObjectToString,
  getTheme,
  getUserPluginData,
  globalStyles,
} from "../codemods/twinMacro";
import { compileConfig } from "./compileConfig";

const getConfigFunction = (config) => () => {
  return resolveConfig(config);
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

/** @typedef {{ tailwindConfig: string, preset: import("../codemods/convertComponent").TailwindToReactPreset }} CompileCSSOptions */
/** @typedef {(options: CompileCSSOptions) => Promise<string>} CompileCSS */
/** @type {CompileCSS} */
export const compileCSS = async ({ tailwindConfig, preset }) => {
  const compiledTailwindConfig = await compileConfig(tailwindConfig);
  if (preset === "twin.macro") {
    const theme = getTheme(compiledTailwindConfig.theme);
    const styles = globalStyles.map((globalFunction) => globalFunction({ theme })).join("\n");

    const userPluginData = getUserPluginData({ config: compiledTailwindConfig });
    const baseStyles = convertCssObjectToString(userPluginData && userPluginData.base);

    return [styles, baseStyles].filter(Boolean).join("\n");
  }
  // @ts-ignore
  const { css } = await postcss([
    {
      postcssPlugin: "tailwindcss",
      plugins: [processTailwindFeatures(getConfigFunction(compiledTailwindConfig))],
    },
    autoprefixer(),
  ]).process("@tailwind base;\n@tailwind components;\n@tailwind utilities;\n", {
    from: undefined,
  });
  return css;
};
