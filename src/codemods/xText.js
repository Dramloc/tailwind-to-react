// @ts-check
import { parseExpression } from "@babel/parser";
import * as t from "@babel/types";
import { replaceXDataIdentifier } from "./replaceXData";
import { isJSXAttributeWithName } from "./utils";

/** @type {(message: string) => void} */
const warn = (message) => console.warn(`[x-text] ${message}`);

/** @type {import("@babel/core").Visitor} */
export const xText = {
  JSXOpeningElement(path) {
    if (path.node.attributes.some(isJSXAttributeWithName("x-data"))) {
      path.stop();
    }
  },
  JSXAttribute(path, params) {
    if (isJSXAttributeWithName("x-text")(path.node)) {
      // Retrieve and parse the x-text expression
      if (!t.isStringLiteral(path.node.value)) {
        warn("Expected x-text attribute value to be StringLiteral.");
        path.remove();
        return;
      }
      const value = path.node.value.value;
      const expression = parseExpression(value);

      // Replace JSXElement children with the x-text expression
      const jsxOpeningElement = path.parentPath;
      if (!t.isJSXOpeningElement(jsxOpeningElement.node)) {
        warn("Expected x-text parent path to be a JSXOpeningElement.");
        path.remove();
        return;
      }
      const jsxElement = jsxOpeningElement.parentPath;
      if (!t.isJSXElement(jsxElement.node)) {
        warn("Expected x-text JSXOpeningElement parent path to be a JSXElement.");
        path.remove();
        return;
      }
      jsxElement.node.children = [t.jsxExpressionContainer(expression)];

      // Traverse expression to replace x-data identifiers
      const children = jsxElement.get("children");
      if (!Array.isArray(children)) {
        warn("Expected x-text JSXElement children path to be an array.");
        path.remove();
        return;
      }
      children.forEach((child) => child.traverse(replaceXDataIdentifier, params));

      path.remove();
    }
  },
};
