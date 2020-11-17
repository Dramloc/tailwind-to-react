/**
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const tailwindSelectMenuListbox = ({ types: t, parse }) => ({
  visitor: {
    JSXAttribute(path) {
      if (path.node.name.name === "x-ref" && path.node.value.value === "listbox") {
        path.scope.push({
          kind: "const",
          id: t.identifier("listboxRef"),
          init: t.callExpression(t.identifier("useRef"), []),
          unique: true,
        });
        path.replaceWith(
          t.jsxAttribute(
            t.jsxIdentifier("ref"),
            t.jsxExpressionContainer(t.identifier("listboxRef"))
          )
        );
        const ulElement = path.parentPath.parentPath;
        if (!ulElement.isJSXElement()) {
          return;
        }
        const children = /** @type {babel.NodePath[]} */ (ulElement.get("children"));
        children
          .filter((child) => {
            return (
              t.isJSXElement(child.node) &&
              t.isJSXIdentifier(child.node.openingElement.name) &&
              child.node.openingElement.name.name === "li"
            );
          })
          .forEach((child, index) => {
            // Add aria-selected={selected === index} attribute
            child
              .get("openingElement")
              .pushContainer(
                "attributes",
                t.jsxAttribute(
                  t.jsxIdentifier("aria-selected"),
                  t.jsxExpressionContainer(
                    t.binaryExpression("===", t.identifier("_selected"), t.numericLiteral(index))
                  )
                )
              );
          });
      }
    },
  },
});
