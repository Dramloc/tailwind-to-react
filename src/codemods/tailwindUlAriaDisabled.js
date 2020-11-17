/**
 * Remove aria-disabled attribute from ul elements @see jsx-a11y/role-supports-aria-props
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const tailwindUlAriaDisabled = ({ types: t }) => ({
  visitor: {
    JSXAttribute(path) {
      if (
        t.isJSXAttribute(path.node) &&
        t.isJSXIdentifier(path.node.name) &&
        path.node.name.name === "aria-disabled" &&
        t.isJSXOpeningElement(path.parent) &&
        t.isJSXIdentifier(path.parent.name) &&
        path.parent.name.name === "ul"
      ) {
        path.remove();
      }
    },
  },
});
