// @ts-check
import { isJSXAttributeWithName } from "./utils";

/**
 * Make sure x-data and x-ref are declared before other jsx attributes.
 * This prevents issues when x-data states or x-ref refs are not declared yet and a x-on, x-bind, etc. attribute uses some of these values.
 * e.g.: `<div x-on.click="open = false" x-data="{ open: true }" />`: the expression `open = false` must reference the `open` state declared by x-data.
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const reorderJSXAttributes = () => {
  /**
   * Move the attribute with the given `jsxIdentifierName` to first position if it exists in the openingElement attributes.
   * @type {(jsxIdentifierName: string, path: babel.NodePath<babel.types.JSXOpeningElement>) => void}
   */
  const moveAttributeToFirstPosition = (jsxIdentifierName, path) => {
    const attributeIndex = path.node.attributes.findIndex(
      isJSXAttributeWithName(jsxIdentifierName)
    );
    if (attributeIndex > -1) {
      const attribute = path.node.attributes[attributeIndex];
      path.node.attributes.splice(attributeIndex, 1);
      path.unshiftContainer("attributes", attribute);
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
