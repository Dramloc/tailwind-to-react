import chalk from "chalk";
import { replaceXDataIdentifier } from "./replaceXData";

const warn = (message) =>
  console.warn(`    ${chalk.yellow("⚠")} ${chalk.gray("[x-bind]")} ${message}`);

/**
 * `x-bind:attribute="expression"` -> `attribute={expression}`
 * `x-bind:class="{'className': expression}"` -> `css={[expression && tw`className`]}`
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
          const properties = expression.properties;
          const css = properties
            .map((property) => {
              if (!t.isObjectProperty(property)) {
                warn("Expected x-bind:class parsed properties to be ObjectProperty");
                return null;
              }
              if (!t.isIdentifier(property.key) && !t.isStringLiteral(property.key)) {
                warn(
                  "Expected x-bind:class parsed property key to be an Identifier or StringLiteral"
                );
                return null;
              }
              const className = t.isStringLiteral(property.key)
                ? property.key.value
                : property.key.name;
              const twinExpression = t.taggedTemplateExpression(
                t.identifier("tw"),
                t.templateLiteral([t.templateElement({ raw: className, cooked: className })], [])
              );
              return t.logicalExpression("&&", property.value, twinExpression);
            })
            .filter(Boolean);

          // Merge with existing css attribute or replace with a new css attribute
          const siblings = [...path.getAllPrevSiblings(), ...path.getAllNextSiblings()];
          const existingAttribute = siblings.find(
            (sibling) =>
              t.isJSXAttribute(sibling.node) &&
              t.isJSXIdentifier(sibling.node.name) &&
              sibling.node.name.name === "css"
          );
          if (
            existingAttribute &&
            t.isJSXAttribute(existingAttribute.node) &&
            t.isJSXExpressionContainer(existingAttribute.node.value) &&
            t.isArrayExpression(existingAttribute.node.value.expression)
          ) {
            existingAttribute.replaceWith(
              t.jsxAttribute(
                t.jsxIdentifier("css"),
                t.jsxExpressionContainer(
                  t.arrayExpression([...existingAttribute.node.value.expression.elements, ...css])
                )
              )
            );
            existingAttribute.traverse(replaceXDataIdentifier(babel), params);
            path.remove();
          } else {
            path.replaceWith(
              t.jsxAttribute(
                t.jsxIdentifier("css"),
                t.jsxExpressionContainer(t.arrayExpression(css))
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
