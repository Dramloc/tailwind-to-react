import { replaceXDataIdentifier } from "./replaceXData";
import { xTransition } from "./xTransition";

/**
 * Transform `x-show="value"` AlpineJS JSX attributes into `className={clsx({ "hidden": !value })}`
 * @type {(babel: globalThis.babel) => babel.Visitor}
 */
export const xShow = (babel) => {
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
      if (
        t.isJSXIdentifier(path.node.name) &&
        path.node.name.name === "x-show" &&
        t.isStringLiteral(path.node.value)
      ) {
        const value = path.node.value.value;
        const hasXTransitionSibling = path.parentPath.get("attributes").some((attribute) => {
          return (
            t.isJSXAttribute(attribute.node) &&
            t.isJSXNamespacedName(attribute.node.name) &&
            attribute.node.name.namespace.name === "x-transition"
          );
        });
        params.hasTransitionChild = false;
        if (hasXTransitionSibling) {
          path.parentPath.traverse(xTransition(babel), params);
        } else {
          params.xShow = value;
          path.parentPath.parentPath.get("children").forEach((child) => {
            child.traverse(xTransition(babel), params);
          });
        }

        if (hasXTransitionSibling || params.hasTransitionChild) {
          const expression = parse(value).program.body[0].expression;
          path.replaceWith(
            t.jsxAttribute(t.jsxIdentifier("show"), t.jsxExpressionContainer(expression))
          );
          path.traverse(replaceXDataIdentifier(babel), params);

          if (params.hasTransitionChild) {
            const currentElement = path.parentPath.node.name.name;
            // Replace element with `Transition`
            const element = t.jsxIdentifier("Transition");
            path.parentPath.node.name = element;
            if (path.parentPath.parentPath.node.closingElement !== null) {
              path.parentPath.parentPath.node.closingElement.name = element;
            }
            // Set `as` attribute
            path.parentPath.pushContainer(
              "attributes",
              t.jsxAttribute(t.jsxIdentifier("as"), t.stringLiteral(currentElement))
            );
          }
        } else {
          // Handle case where there are no x-transition child with the same x-show value
          // TODO: code similar to x-bind, could be replaced with x-bind:class="{ 'hidden': !value }"
          const expression = parse(`!(${value})`).program.body[0].expression;
          const className = "hidden";
          const clsx = t.objectExpression([
            t.objectProperty(t.stringLiteral(className), expression),
          ]);

          const siblings = [...path.getAllPrevSiblings(), ...path.getAllNextSiblings()];
          const existingAttribute = siblings.find(
            (sibling) =>
              t.isJSXAttribute(sibling.node) &&
              t.isJSXIdentifier(sibling.node.name) &&
              sibling.node.name.name === "className"
          );
          if (existingAttribute) {
            if (
              t.isJSXExpressionContainer(existingAttribute.node.value) &&
              t.isCallExpression(existingAttribute.node.value.expression) &&
              existingAttribute.node.value.expression.callee.name === "clsx"
            ) {
              // Expression is already a clsx call expression, push the new clsx object to the arguments
              const clsxCall = existingAttribute.get("value.expression");
              clsxCall.pushContainer("arguments", clsx);
            }
            if (t.isStringLiteral(existingAttribute.node.value)) {
              // Existing className is a string, create a clsx expression
              const className = existingAttribute.node.value;
              existingAttribute.replaceWith(
                t.jsxAttribute(
                  t.jsxIdentifier("className"),
                  t.jsxExpressionContainer(
                    t.callExpression(t.identifier("clsx"), [className, clsx])
                  )
                )
              );
            }
            existingAttribute.traverse(replaceXDataIdentifier(babel), params);
            path.remove();
          } else {
            // There is no existing className, create one with a clsx call expression
            path.replaceWith(
              t.jsxAttribute(
                t.jsxIdentifier("className"),
                t.jsxExpressionContainer(t.callExpression(t.identifier("clsx"), [clsx]))
              )
            );
            path.traverse(replaceXDataIdentifier(babel), params);
          }
        }
      }
    },
  };
};
