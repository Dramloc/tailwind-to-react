/**
 * Make sure x-data and x-ref are declared before x-on
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const reorderJSXAttributes = ({ types: t }) => ({
  visitor: {
    JSXOpeningElement(path) {
      const xDataAttributeIndex = path.node.attributes.findIndex(
        (attribute) =>
          t.isJSXAttribute(attribute) &&
          t.isJSXIdentifier(attribute.name) &&
          attribute.name.name === "x-data"
      );
      // Move x-data definitions to the first attribute
      if (xDataAttributeIndex > -1) {
        const xDataAttribute = path.node.attributes[xDataAttributeIndex];
        path.node.attributes.splice(xDataAttributeIndex, 1);
        path.node.attributes.unshift(xDataAttribute);
      }

      const xRefAttributeIndex = path.node.attributes.findIndex(
        (attribute) =>
          t.isJSXAttribute(attribute) &&
          t.isJSXIdentifier(attribute.name) &&
          attribute.name.name === "x-ref"
      );
      // Move x-ref definitions to the first attribute
      if (xRefAttributeIndex > -1) {
        const xRefAttribute = path.node.attributes[xRefAttributeIndex];
        path.node.attributes.splice(xRefAttributeIndex, 1);
        path.node.attributes.unshift(xRefAttribute);
      }
    },
  },
});
