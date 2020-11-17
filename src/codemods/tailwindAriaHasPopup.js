/**
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const tailwindAriaHasPopup = ({ types: t }) => ({
  visitor: {
    JSXAttribute(path) {
      if (t.isJSXIdentifier(path.node.name) && path.node.name.name === "aria-has-popup") {
        path.node.name = t.jsxIdentifier("aria-haspopup");
      }
    },
  },
});
