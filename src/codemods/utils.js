// @ts-check
import { types as t } from "@babel/core";
import { replaceXDataIdentifier } from "./replaceXData";

/** @typedef {t.JSXAttribute & { name: t.JSXIdentifier }} JSXAttributeWithName */
/** @typedef {t.JSXAttribute & { name: t.JSXNamespacedName }} JSXAttributeWithNamespace */

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

/** @type {(clsx: t.ObjectExpression, path: import("@babel/core").NodePath<t.JSXAttribute>, params: any) => void} */
export const addClsxToPath = (clsx, path, params) => {
  const siblings = /** @type {import("@babel/core").NodePath<t.JSXAttribute>[]} */ ([
    ...path.getAllPrevSiblings(),
    ...path.getAllNextSiblings(),
  ]);
  const existingAttribute = siblings.find((sibling) =>
    isJSXAttributeWithName("className")(sibling.node)
  );

  if (existingAttribute) {
    if (
      t.isJSXExpressionContainer(existingAttribute.node.value) &&
      t.isCallExpression(existingAttribute.node.value.expression) &&
      t.isIdentifier(existingAttribute.node.value.expression.callee) &&
      existingAttribute.node.value.expression.callee.name === "clsx"
    ) {
      // Expression is already a clsx call expression, push the new clsx object to the arguments
      const clsxCall = /** @type {import("@babel/core").NodePath<t.CallExpression>} */ (existingAttribute.get(
        "value.expression"
      ));
      clsxCall.pushContainer("arguments", clsx);
    }
    if (t.isStringLiteral(existingAttribute.node.value)) {
      // Existing className is a string, create a clsx expression
      const className = existingAttribute.node.value;
      existingAttribute.replaceWith(
        t.jsxAttribute(
          t.jsxIdentifier("className"),
          t.jsxExpressionContainer(t.callExpression(t.identifier("clsx"), [className, clsx]))
        )
      );
    }
    existingAttribute.traverse(replaceXDataIdentifier, params);
    path.remove();
  } else {
    // There is no existing className, create one with a clsx call expression
    path.replaceWith(
      t.jsxAttribute(
        t.jsxIdentifier("className"),
        t.jsxExpressionContainer(t.callExpression(t.identifier("clsx"), [clsx]))
      )
    );
    path.traverse(replaceXDataIdentifier, params);
  }
};
