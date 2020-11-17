/**
 * `x-max="any"` -> ``
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const xMax = () => ({
  visitor: {
    JSXAttribute(path) {
      if (path.node.name.name === "x-max") {
        path.remove();
      }
    },
  },
});
