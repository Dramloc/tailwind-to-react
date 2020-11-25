// @ts-check
import { parseExpression } from "@babel/parser";
import { types as t } from "@babel/core";
import { replaceXDataIdentifier } from "./replaceXData";
import { addClsxToPath, isJSXAttributeWithName, isJSXAttributeWithNamespace } from "./utils";

/** @type {(message: string) => void} */
const warn = (message) => console.warn(`[x-bind] ${message}`);

/**
 * `x-bind:attribute="expression"` -> `attribute={expression}`
 * `x-bind:class="{'className': expression}"` -> `className={clsx(currentClassName, { [className]: expression })}`
 * @type {import("@babel/core").Visitor}
 */
export const xBind = {
  JSXOpeningElement(path) {
    if (path.node.attributes.some(isJSXAttributeWithName("x-data"))) {
      path.stop();
    }
  },
  JSXAttribute(path, params) {
    if (isJSXAttributeWithNamespace("x-bind")(path.node)) {
      const attribute = path.node.name.name.name;
      if (!t.isStringLiteral(path.node.value)) {
        warn("Expected x-bind value to be a StringLiteral");
        path.remove();
        return;
      }
      const value = path.node.value.value;
      const expression = parseExpression(value);

      if (attribute === "class") {
        if (!t.isObjectExpression(expression)) {
          warn("Expected x-bind:class parsed value to be an ObjectExpression");
          path.remove();
          return;
        }
        const clsx = expression;
        addClsxToPath(clsx, path, params);
      } else {
        path.replaceWith(
          t.jsxAttribute(t.jsxIdentifier(attribute), t.jsxExpressionContainer(expression))
        );
        path.traverse(replaceXDataIdentifier, params);

        const siblings = [...path.getAllPrevSiblings(), ...path.getAllNextSiblings()];
        const duplicateAttribute = siblings.find(
          (sibling) =>
            t.isJSXAttribute(sibling.node) &&
            t.isJSXIdentifier(sibling.node.name) &&
            sibling.node.name.name === attribute
        );
        if (
          duplicateAttribute &&
          t.isJSXAttribute(duplicateAttribute.node) &&
          t.isLiteral(duplicateAttribute.node.value)
        ) {
          duplicateAttribute.remove();
        }
      }
    }
  },
};
