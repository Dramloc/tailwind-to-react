// https://github.com/tailwindlabs/tailwindcss/blob/master/src/processTailwindFeatures.js
import hash from "object-hash";
import postcss from "postcss";
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
import corePlugins from "./corePlugins";

let previousConfig = null;
let processedPlugins = null;
let getProcessedPlugins = null;

export default function processTailwindFeatures(getConfig) {
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

    const plugins = [
      substituteTailwindAtRules(config, getProcessedPlugins()),
      evaluateTailwindFunctions(config),
      substituteVariantsAtRules(config, getProcessedPlugins()),
      substituteResponsiveAtRules(config),
      convertLayerAtRulesToControlComments(),
      substituteScreenAtRules(config),
      substituteClassApplyAtRules(config, getProcessedPlugins, configChanged),
      applyImportantConfiguration(config),
    ];

    return postcss(plugins).process(css, { from: undefined });
  };
}
