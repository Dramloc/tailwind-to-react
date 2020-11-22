// @ts-check
import { isJSXAttributeWithName } from "./utils";

/**
 * `<div x-description="comment"` -> `{/* comment *\/} <div`
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const xDescription = ({ types: t }) => ({
  visitor: {
    JSXElement(path) {
      const xDescriptionAttribute = path.node.openingElement.attributes.find(
        (attribute) =>
          isJSXAttributeWithName("x-description")(attribute) ||
          isJSXAttributeWithName("x-descriptions")(attribute)
      );
      if (
        xDescriptionAttribute &&
        t.isJSXAttribute(xDescriptionAttribute) &&
        t.isStringLiteral(xDescriptionAttribute.value)
      ) {
        const jsxComment = t.jsxEmptyExpression();
        // @ts-ignore Comments must be created in the "comment" property to allow Recast to handle them
        jsxComment.comments = [
          {
            type: "CommentBlock",
            value: ` ${xDescriptionAttribute.value.value} `,
          },
        ];
        path.insertBefore(t.jsxText("\n"));
        path.insertBefore(t.jsxExpressionContainer(jsxComment));
        path.insertBefore(t.jsxText("\n"));
      }
    },
    JSXAttribute(path) {
      if (
        isJSXAttributeWithName("x-description")(path.node) ||
        isJSXAttributeWithName("x-descriptions")(path.node)
      ) {
        path.remove();
      }
    },
  },
});
