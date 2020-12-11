// https://github.com/tailwindlabs/tailwindcss/blob/master/src/corePlugins.js
import { corePluginList } from "tailwindcss/lib/corePluginList";
import configurePlugins from "tailwindcss/lib/util/configurePlugins";
import * as plugins from "./plugins";

export default function corePlugins({ corePlugins: corePluginConfig }) {
  return configurePlugins(corePluginConfig, corePluginList).map((pluginName) => {
    return plugins[pluginName]();
  });
}
