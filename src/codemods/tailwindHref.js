/**
 * `href="#"` -> `href="/fixme"`
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const tailwindHref = ({ types: t }) => ({
  visitor: {
    JSXAttribute(path) {
      if (path.node.name.name === "href" && path.node.value.value === "#") {
        path.node.value = t.stringLiteral("/fixme");
      }
    },
  },
});
