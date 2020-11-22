import { replaceXDataIdentifier } from "./replaceXData";

const attributeMapping = {
  enter: "enter",
  "enter-start": "enterFrom",
  "enter-end": "enterTo",
  leave: "leave",
  "leave-start": "leaveFrom",
  "leave-end": "leaveTo",
};

/**
 * @type {(babel: globalThis.babel) => babel.Visitor}
 */
export const xTransition = (babel) => {
  const { types: t, parse } = babel;

  /** @type {(node: object) => node is babel.types.JSXAttribute} */
  const isXTranstionAttribute = (node) =>
    t.isJSXAttribute(node) &&
    t.isJSXNamespacedName(node.name) &&
    node.name.namespace.name === "x-transition";

  /** @type {(node: object) => node is babel.types.JSXAttribute} */
  const isXShowAttribute = (path) =>
    t.isJSXAttribute(path.node) &&
    t.isJSXIdentifier(path.node.name) &&
    path.node.name.name === "x-show";

  return {
    JSXOpeningElement(path, params) {
      const hasXData = path.node.attributes.some(
        (attribute) =>
          t.isJSXAttribute(attribute) &&
          t.isJSXIdentifier(attribute.name) &&
          attribute.name.name === "x-data"
      );
      if (hasXData) {
        path.stop();
      }

      const xTransitionAttributes = path.node.attributes.filter(isXTranstionAttribute);
      if (xTransitionAttributes.length > 0) {
        const xShowAttribute = path.get("attributes").find(isXShowAttribute);
        let hasTransitionParent = false;
        if (
          xShowAttribute &&
          t.isJSXAttribute(xShowAttribute.node) &&
          t.isLiteral(xShowAttribute.node.value)
        ) {
          const value = xShowAttribute.node.value.value;
          if (params.xShow === value) {
            hasTransitionParent = true;
            params.hasTransitionChild = true;
            xShowAttribute.remove();
          } else {
            const expression = parse(value).program.body[0].expression;
            xShowAttribute.replaceWith(
              t.jsxAttribute(t.jsxIdentifier("show"), t.jsxExpressionContainer(expression))
            );
            xShowAttribute.traverse(replaceXDataIdentifier(babel), params);
          }
        }

        const currentElement = path.node.name.name;
        // Replace element with `Transition`
        const element = hasTransitionParent
          ? t.jsxMemberExpression(t.jsxIdentifier("Transition"), t.jsxIdentifier("Child"))
          : t.jsxIdentifier("Transition");
        path.node.name = element;
        if (path.parentPath.node.closingElement !== null) {
          path.parentPath.node.closingElement.name = element;
        }
        // Set `as` attribute
        path.pushContainer(
          "attributes",
          t.jsxAttribute(t.jsxIdentifier("as"), t.stringLiteral(currentElement))
        );
        // Replace x-transition attributes with Transition jsx attributes
        xTransitionAttributes.forEach((attribute) => {
          const attributeName = attributeMapping[attribute.name.name.name];
          attribute.name = t.jsxIdentifier(attributeName);
          const className = attribute.value.value;
          attribute.value = t.stringLiteral(className);
        });
      }
    },
  };
};
