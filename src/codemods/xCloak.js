/**
 * `x-cloak="any"` -> ``
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const xCloak = () => ({
  visitor: {
    JSXAttribute(path) {
      if (path.node.name.name === "x-cloak") {
        path.remove();
      }
    },
  },
});
