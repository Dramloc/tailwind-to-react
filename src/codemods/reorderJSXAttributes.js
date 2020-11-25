// @ts-check
import { isJSXAttributeWithName } from "./utils";

/**
 * Make sure x-data and x-ref are declared before other jsx attributes.
 * This prevents issues when x-data states or x-ref refs are not declared yet and a x-on, x-bind, etc. attribute uses some of these values.
 * e.g.: `<div x-on.click="open = false" x-data="{ open: true }" />`: the expression `open = false` must reference the `open` state declared by x-data.
 * @type {() => import("@babel/core").PluginObj}
 */
export const reorderJSXAttributes = () => {
  /**
   * Move the attribute with the given `jsxIdentifierName` to first position if it exists in the openingElement attributes.
   * @type {(jsxIdentifierName: string, jsxOpeningElement: import("@babel/core").NodePath<import("@babel/core").types.JSXOpeningElement>) => void}
   */
  const moveAttributeToFirstPosition = (jsxIdentifierName, jsxOpeningElement) => {
    const attributeIndex = jsxOpeningElement.node.attributes.findIndex(
      isJSXAttributeWithName(jsxIdentifierName)
    );
    if (attributeIndex > -1) {
      const attribute = jsxOpeningElement.node.attributes[attributeIndex];
      jsxOpeningElement.node.attributes.splice(attributeIndex, 1);
      jsxOpeningElement.unshiftContainer("attributes", attribute);
    }
  };

  return {
    visitor: {
      JSXOpeningElement(path) {
        moveAttributeToFirstPosition("x-data", path);
        moveAttributeToFirstPosition("x-ref", path);
      },
    },
  };
};
