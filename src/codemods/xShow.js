// @ts-check
import { types as t } from "@babel/core";
import { parseExpression } from "@babel/parser";
import { replaceXDataIdentifier } from "./replaceXData";
import { addStyleToPath, isJSXAttributeWithName, isJSXAttributeWithNamespace } from "./utils";
import { xTransition } from "./xTransition";

/** @type {(message: string) => void} */
const warn = (message) => console.warn(`[x-show] ${message}`);

/**
 * Transform `x-show="value"` AlpineJS JSX attributes into `className={clsx({ "hidden": !value })}`
 * @type {import("@babel/core").Visitor}
 */
export const xShow = {
  JSXOpeningElement(path) {
    if (path.node.attributes.some(isJSXAttributeWithName("x-data"))) {
      path.stop();
    }
  },
  JSXAttribute(path, params) {
    if (isJSXAttributeWithName("x-show")(path.node)) {
      if (!t.isStringLiteral(path.node.value)) {
        warn("Expected x-show value to be a StringLiteral.");
        path.remove();
        return;
      }
      const jsxOpeningElement = path.parentPath;
      if (!t.isJSXOpeningElement(jsxOpeningElement.node)) {
        warn("Expected x-show parent to be a JSXOpeningElement.");
        path.remove();
        return;
      }
      const jsxElement = jsxOpeningElement.parentPath;
      if (!t.isJSXElement(jsxElement.node)) {
        warn("Expected x-show JSXOpeningElement parent to be a JSXElement.");
        path.remove();
        return;
      }
      const attributes = jsxOpeningElement.get("attributes");
      if (!Array.isArray(attributes)) {
        warn("Expected x-show JSXOpeningElement attributes to be an array.");
        path.remove();
        return;
      }
      const children = jsxElement.get("children");
      if (!Array.isArray(children)) {
        warn("Expected x-show JSXElement children to be an array.");
        path.remove();
        return;
      }

      // Retrieve the x-show attribute value
      const value = path.node.value.value;

      // Check if element has some x-transition attributes
      const hasXTransitionSibling = attributes.some((attribute) =>
        isJSXAttributeWithNamespace("x-transition")(attribute.node)
      );

      const traversalParams = hasXTransitionSibling
        ? { ...params, hasTransitionChild: false }
        : { ...params, hasTransitionChild: false, xShow: value };
      if (hasXTransitionSibling) {
        // Element has some x-transition attributes, transform it to a `Transition` element with xTransition
        jsxOpeningElement.traverse(xTransition, traversalParams);
      } else {
        // Element don't have x-transition attributes.
        // Check with xTransition if it has some child elements with x-transition attributes and the same x-show value.
        children.forEach((child) => {
          child.traverse(xTransition, traversalParams);
        });
      }

      if (traversalParams.hasTransitionChild) {
        // Element has some Transition child elements with the same x-show value, replace the element with a `Transition`
        const currentElement = jsxOpeningElement.node.name;
        if (!t.isJSXIdentifier(currentElement)) {
          warn("Expected x-show JSXOpeningElement name to be a JSXIdentifier.");
          return;
        }
        // Replace element with `Transition`
        const element = t.jsxIdentifier("Transition");
        jsxOpeningElement.node.name = element;
        if (jsxElement.node.closingElement !== null) {
          jsxElement.node.closingElement.name = element;
        }
        // Set `as` attribute
        jsxOpeningElement.pushContainer(
          "attributes",
          t.jsxAttribute(t.jsxIdentifier("as"), t.stringLiteral(currentElement.name))
        );
      }

      if (hasXTransitionSibling || traversalParams.hasTransitionChild) {
        const expression = parseExpression(value);
        path.replaceWith(
          t.jsxAttribute(t.jsxIdentifier("show"), t.jsxExpressionContainer(expression))
        );
        path.traverse(replaceXDataIdentifier, params);
      } else {
        // Handle case where there are no x-transition child with the same x-show value
        const expression = parseExpression(`!(${value})`);
        const style = t.objectExpression([t.objectProperty(t.stringLiteral("hidden"), expression)]);
        addStyleToPath(style, path, params);
      }
    }
  },
};
