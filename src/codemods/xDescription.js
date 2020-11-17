/**
 * `<div x-description="comment"` -> `{/* comment *\/} <div`
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const xDescription = ({ types: t }) => ({
  visitor: {
    JSXElement(path) {
      const xDescriptionAttribute = path.node.openingElement.attributes.find(
        (attribute) =>
          attribute.name.name === "x-description" ||
          // Handle type in Overlays slide-overs
          attribute.name.name === "x-descriptions"
      );
      if (xDescriptionAttribute) {
        const jsxComment = t.jsxEmptyExpression();
        jsxComment.comments = [
          {
            type: "CommentBlock",
            value: ` ${xDescriptionAttribute.value.value} `,
          },
        ];
        path.insertBefore(t.jsxExpressionContainer(jsxComment));
      }
    },
    JSXAttribute(path) {
      if (
        path.node.name.name === "x-description" ||
        // Handle type in Overlays slide-overs
        path.node.name.name === "x-descriptions"
      ) {
        path.remove();
      }
    },
  },
});
