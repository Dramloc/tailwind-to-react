import { replaceXDataIdentifier } from "./replaceXData";

const warn = (message) => console.warn(`[x-bind] ${message}`);

/**
 * `x-bind:attribute="expression"` -> `attribute={expression}`
 * `x-bind:class="{'className': expression}"` -> `className={clsx(currentClassName, { [className]: expression })}`
 * @type {(babel: globalThis.babel) => babel.Visitor}
 */
export const xBind = (babel) => {
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
      if (t.isJSXNamespacedName(path.node.name) && path.node.name.namespace.name === "x-bind") {
        const attribute = path.node.name.name.name;
        if (!t.isStringLiteral(path.node.value)) {
          warn("Expected x-bind value to be a StringLiteral");
          path.remove();
          return;
        }
        const value = path.node.value.value;
        const expression = parse(`const value = ${value}`).program.body[0].declarations[0].init;

        if (attribute === "class") {
          if (!t.isObjectExpression(expression)) {
            warn("Expected x-bind:class parsed value to be an ObjectExpression");
            path.remove();
            return;
          }
          const clsx = expression;

          // Merge with existing css attribute or replace with a new css attribute
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
        } else {
          path.replaceWith(
            t.jsxAttribute(t.jsxIdentifier(attribute), t.jsxExpressionContainer(expression))
          );
          path.traverse(replaceXDataIdentifier(babel), params);
          const siblings = [...path.getAllPrevSiblings(), ...path.getAllNextSiblings()];
          const duplicateAttribute = siblings.find(
            (sibling) =>
              t.isJSXAttribute(sibling.node) &&
              t.isJSXIdentifier(sibling.node.name) &&
              sibling.node.name.name === attribute
          );
          if (duplicateAttribute && t.isLiteral(duplicateAttribute.node.value)) {
            duplicateAttribute.remove();
          }
        }
      }
    },
  };
};
