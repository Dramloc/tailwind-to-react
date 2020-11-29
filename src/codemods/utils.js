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

/** @type {(style: t.ObjectExpression, path: import("@babel/core").NodePath<t.JSXAttribute>, params: any) => void} */
const addClsxToPath = (style, path, params) => {
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
      clsxCall.pushContainer("arguments", style);
    }
    if (t.isStringLiteral(existingAttribute.node.value)) {
      // Existing className is a string, create a clsx expression
      const className = existingAttribute.node.value;
      existingAttribute.replaceWith(
        t.jsxAttribute(
          t.jsxIdentifier("className"),
          t.jsxExpressionContainer(t.callExpression(t.identifier("clsx"), [className, style]))
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
        t.jsxExpressionContainer(t.callExpression(t.identifier("clsx"), [style]))
      )
    );
    path.traverse(replaceXDataIdentifier, params);
  }
};

/** @type {(style: t.ObjectExpression, path: import("@babel/core").NodePath<t.JSXAttribute>, params: any) => void} */
const addTwinMacroToPath = (style, path, params) => {
  const twinExpressions = convertStyleObjectExpressionToTwinExpressions(style);

  const siblings = /** @type {import("@babel/core").NodePath<t.JSXAttribute>[]} */ ([
    ...path.getAllPrevSiblings(),
    ...path.getAllNextSiblings(),
  ]);
  const existingAttribute = siblings.find((sibling) => isJSXAttributeWithName("css")(sibling.node));

  if (existingAttribute) {
    if (
      t.isJSXExpressionContainer(existingAttribute.node.value) &&
      t.isArrayExpression(existingAttribute.node.value.expression)
    ) {
      const existingTwinExpressions = /** @type {import("@babel/core").NodePath<t.ArrayExpression>} */ (existingAttribute.get(
        "value.expression"
      ));
      existingTwinExpressions.pushContainer("elements", twinExpressions);
    }
    existingAttribute.traverse(replaceXDataIdentifier, params);
    path.remove();
  } else {
    // There is no existing css prop, create one with the twin expression
    path.replaceWith(
      t.jsxAttribute(
        t.jsxIdentifier("css"),
        t.jsxExpressionContainer(t.arrayExpression(twinExpressions))
      )
    );
    path.traverse(replaceXDataIdentifier, params);
  }
};

/** @type {(style: t.ObjectExpression, path: import("@babel/core").NodePath<t.JSXAttribute>, params: any) => void} */
export const addStyleToPath = (style, path, params) => {
  switch (params.preset) {
    case "twin.macro":
      return addTwinMacroToPath(style, path, params);
    case "clsx":
    default:
      return addClsxToPath(style, path, params);
  }
};

/**
 * Convert style object expression to twin style expression
 * e.g.: ObjectExpression({ "class1": expression1, "class2": expression2 }) becomes [expression1 && tw`class1`, expression2 && tw`class2`]
 * @type {(style: t.ObjectExpression) => t.LogicalExpression[]} */
export const convertStyleObjectExpressionToTwinExpressions = (style) => {
  return style.properties
    .map((property) => {
      if (!t.isObjectProperty(property)) {
        return null;
      }
      if (!t.isIdentifier(property.key) && !t.isStringLiteral(property.key)) {
        return null;
      }
      const className = t.isIdentifier(property.key) ? property.key.name : property.key.value;
      const expression = property.value;
      if (!t.isExpression(expression)) {
        return null;
      }
      const twinExpression = createTwinExpression(className);
      return t.logicalExpression("&&", expression, twinExpression);
    })
    .filter(Boolean);
};

/** @type {(className: string) => t.TaggedTemplateExpression} */
export const createTwinExpression = (className) => {
  return t.taggedTemplateExpression(
    t.identifier("tw"),
    t.templateLiteral([t.templateElement({ raw: className, cooked: className })], [])
  );
};
