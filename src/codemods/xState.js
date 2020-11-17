/**
 * Remove x-state jsx attributes
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const xState = ({ types: t }) => ({
  visitor: {
    JSXAttribute(path) {
      if (t.isJSXNamespacedName(path.node.name) && path.node.name.namespace.name === "x-state") {
        path.remove();
      }
    },
  },
});
