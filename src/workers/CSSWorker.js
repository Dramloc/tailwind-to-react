// @ts-check
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import resolveConfig from "tailwindcss/resolveConfig";
import {
  convertCssObjectToString,
  getTheme,
  getUserPluginData,
  globalStyles,
} from "../codemods/twinMacro";
import processTailwindFeatures from "../tailwind/processTailwindFeatures";
import { compileConfig } from "./compileConfig";

const getConfigFunction = (config) => () => {
  return resolveConfig(config);
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
