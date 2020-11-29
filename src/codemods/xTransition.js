// @ts-check
import { types as t } from "@babel/core";
import { parseExpression } from "@babel/parser";
import { replaceXDataIdentifier } from "./replaceXData";
import { createTwinExpression, isJSXAttributeWithName, isJSXAttributeWithNamespace } from "./utils";

/** @type {(message: string) => void} */
const warn = (message) => console.warn(`[x-transition] ${message}`);

const attributeMapping = {
  enter: "enter",
  "enter-start": "enterFrom",
  "enter-end": "enterTo",
  leave: "leave",
  "leave-start": "leaveFrom",
  "leave-end": "leaveTo",
};

/** @type {import("@babel/core").Visitor} */
export const xTransition = {
  JSXOpeningElement(
    path,
    /** @type {{ xShow?: string, hasTransitionChild?: boolean, preset: import("./convertComponent").TailwindToReactPreset }} */ params
  ) {
    if (path.node.attributes.some(isJSXAttributeWithName("x-data"))) {
      path.stop();
      return;
    }

    const xTransitionAttributes = path
      .get("attributes")
      .filter((attribute) => isJSXAttributeWithNamespace("x-transition")(attribute.node));
    if (xTransitionAttributes.length > 0) {
      // If element has some x-transition attributes:
      // Check if there is a x-show attribute present on the current element
      const xShowAttribute = path
        .get("attributes")
        .find((attribute) => isJSXAttributeWithName("x-show")(attribute.node));

      let hasTransitionParent = false;
      if (
        xShowAttribute &&
        t.isJSXAttribute(xShowAttribute.node) &&
        t.isLiteral(xShowAttribute.node.value)
      ) {
        const value = xShowAttribute.node.value.value;
        if (params.xShow === value) {
          // If the current xShow expression (set in the xShow visitor in a parent element) is the same as the current element,
          // we will replace the current element with Transition.Child
          // The "open" attribute is handled by the parent element so we can remove it here.
          hasTransitionParent = true;
          xShowAttribute.remove();
          // Set the `hasTransitionChild` to true so that the parent element handled by xShow is replaced by a Transition element
          // instead of a className to hide it.
          params.hasTransitionChild = true;
        } else {
          // The element does not have a parent element with the same x-show expression. It will be replaced with a Transition element.
          // Parse the x-show expression here and replace the "x-show" attribute with the Transition "show" attribute.
          xShowAttribute.replaceWith(
            t.jsxAttribute(
              t.jsxIdentifier("show"),
              t.jsxExpressionContainer(parseExpression(value))
            )
          );
          // Traverse the expression to apply x-data identifiers mappings
          xShowAttribute.traverse(replaceXDataIdentifier, params);
        }
      }

      // Replace element with `Transition` or `Transition.Child`
      const currentElement = path.node.name;
      if (!t.isJSXIdentifier(currentElement)) {
        warn("Expected x-transition JSXOpeningElement name to be a JSXIdentifier.");
        return;
      }
      const jsxElement = path.parentPath;
      if (!t.isJSXElement(jsxElement.node)) {
        warn("Expected x-transition JSXOpeningElement parent to be a JSXElement.");
        return;
      }
      const transitionElement = hasTransitionParent
        ? t.jsxMemberExpression(t.jsxIdentifier("Transition"), t.jsxIdentifier("Child"))
        : t.jsxIdentifier("Transition");
      path.node.name = transitionElement;
      if (jsxElement.node.closingElement !== null) {
        jsxElement.node.closingElement.name = transitionElement;
      }

      // Add the `as` attribute with the existing element name
      path.pushContainer(
        "attributes",
        t.jsxAttribute(t.jsxIdentifier("as"), t.stringLiteral(currentElement.name))
      );

      // Replace x-transition attributes with Transition jsx attributes
      xTransitionAttributes.forEach((attribute) => {
        if (
          !t.isJSXAttribute(attribute.node) ||
          !t.isJSXNamespacedName(attribute.node.name) ||
          !t.isStringLiteral(attribute.node.value)
        ) {
          warn("Expected x-transition attribute value to be a StringLiteral.");
          return;
        }
        const attributeName = attributeMapping[attribute.node.name.name.name];
        const className = attribute.node.value.value;
        switch (params.preset) {
          case "twin.macro":
            attribute.replaceWith(
              t.jsxAttribute(
                t.jsxIdentifier(attributeName),
                t.jsxExpressionContainer(createTwinExpression(className))
              )
            );
            break;
          case "clsx":
          default:
            attribute.replaceWith(
              t.jsxAttribute(t.jsxIdentifier(attributeName), t.stringLiteral(className))
            );
            break;
        }
      });
    }
  },
};
