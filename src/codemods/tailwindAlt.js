/**
 * `alt` -> `alt=""`
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const tailwindAlt = ({ types: t }) => ({
  visitor: {
    JSXAttribute(path) {
      if (path.node.name.name === "alt" && path.node.value === null) {
        path.node.value = t.stringLiteral("");
      }
    },
  },
});
