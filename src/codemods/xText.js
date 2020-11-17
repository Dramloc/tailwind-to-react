import { replaceXDataIdentifier } from "./replaceXData";

/**
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const xText = (babel) => {
  const { types: t, parse } = babel;
  return {
    JSXOpeningElement(path) {
      const hasXData = path.node.attributes.some(
        (attribute) =>
          t.isJSXAttribute(attribute) &&
          t.isJSXIdentifier(attribute.name) &&
          attribute.name.name === "x-data"
      );
      if (hasXData) {
        path.stop();
      }
    },
    JSXAttribute(path, params) {
      if (t.isJSXIdentifier(path.node.name) && path.node.name.name === "x-text") {
        const value = path.node.value.value;
        const expression = parse(value).program.body[0].expression;
        path.parentPath.parentPath.node.children = [t.jsxExpressionContainer(expression)];
        path.parentPath.parentPath
          .get("children")
          .map((child) => child.traverse(replaceXDataIdentifier(babel), params));
        path.remove();
      }
    },
  };
};
