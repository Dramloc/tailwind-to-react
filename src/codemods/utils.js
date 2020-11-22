import * as t from "@babel/types";

/** @typedef {babel.types.JSXAttribute & { name: babel.types.JSXIdentifier }} JSXAttributeWithName */
/** @typedef {babel.types.JSXAttribute & { name: babel.types.JSXNamespacedName }} JSXAttributeWithNamespace */

export const isJSXAttributeWithName = (
  /** @type {string} */ name
) => /** @type {(node: object) => node is JSXAttributeWithName} */ (node) =>
  t.isJSXAttribute(node) && t.isJSXIdentifier(node.name) && node.name.name === name;

export const isJSXAttributeWithNamespace = (
  /** @type {string} */ namespace
) => /** @type {(node: object) => node is JSXAttributeWithNamespace} */ (node) =>
  t.isJSXAttribute(node) &&
  t.isJSXNamespacedName(node.name) &&
  node.name.namespace.name === namespace;
