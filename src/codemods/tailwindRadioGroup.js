/**
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const tailwindRadioGroup = ({ types: t, parse }) => ({
  visitor: {
    JSXAttribute(path) {
      if (
        t.isJSXIdentifier(path.node.name) &&
        path.node.name.name === "x-data" &&
        t.isStringLiteral(path.node.value) &&
        path.node.value.value === "radioGroup()"
      ) {
        path.replaceWith(
          t.jsxAttribute(
            t.jsxIdentifier("x-data"),
            t.stringLiteral(
              `{
                active: 0,
                select(index) { this.active = index; },
                onArrowUp(index) { this.active = active - 1 < 0 ? radioGroupRef.current.children.length - 1 : active - 1; },
                onArrowDown(index) { this.active = active + 1 > radioGroupRef.current.children.length - 1 ? 0 : active + 1; }
              }`
            )
          )
        );
        return;
      }
      if (
        t.isJSXIdentifier(path.node.name) &&
        path.node.name.name === "x-ref" &&
        t.isStringLiteral(path.node.value) &&
        path.node.value.value === "radiogroup"
      ) {
        path.scope.push({
          kind: "const",
          id: t.identifier("radioGroupRef"),
          init: t.callExpression(t.identifier("useRef"), []),
          unique: true,
        });
        path.replaceWith(
          t.jsxAttribute(
            t.jsxIdentifier("ref"),
            t.jsxExpressionContainer(t.identifier("radioGroupRef"))
          )
        );
      }
    },
  },
});
