/**
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const tailwindStep = ({ types: t }) => ({
  visitor: {
    JSXExpressionContainer(path) {
      if (t.isJSXEmptyExpression(path.node.expression) && path.node.expression.innerComments) {
        const comment = path.node.expression.innerComments.find(
          (comment) => comment.value === " Completed Step " || comment.value === " Upcoming Step "
        );
        if (!comment) {
          return;
        }
        const linkElement = path
          .getAllNextSiblings()
          .find(
            (sibling) =>
              t.isJSXElement(sibling.node) &&
              sibling.node.openingElement.name.name === "a" &&
              sibling.node.closingElement === null
          );
        if (!linkElement) {
          return;
        }
        linkElement.node.openingElement.selfClosing = false;
        linkElement.node.closingElement = t.jsxClosingElement(t.jsxIdentifier("a"));
        linkElement.node.children.push(
          t.jsxElement(
            t.jsxOpeningElement(t.jsxIdentifier("span"), [
              t.jsxAttribute(t.jsxIdentifier("tw"), t.stringLiteral("sr-only")),
            ]),
            t.jsxClosingElement(t.jsxIdentifier("span")),
            [t.jsxText(comment.value.trim())]
          )
        );
      }
    },
  },
});
