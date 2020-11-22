import chalk from "chalk";
import { upperFirst } from "../shared/upperFirst";
import { replaceXDataAssignment, replaceXDataIdentifier } from "./replaceXData";

const warn = (message) =>
  console.warn(`    ${chalk.yellow("⚠")} ${chalk.gray("[x-on]")} ${message}`);

/**
 * @type {(babel: globalThis.babel) => babel.Visitor}
 */
export const xOn = (babel) => {
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
      if (t.isJSXNamespacedName(path.node.name) && path.node.name.namespace.name === "x-on") {
        const attribute = path.node.name.name.name;
        const [event, ...modifiers] = attribute.split("$");
        const value = path.node.value.value;
        const statements = parse(value).program.body;
        const expressions = statements
          .filter((statement) => {
            if (t.isAssignmentExpression(statement.expression)) {
              return true;
            }
            if (t.isCallExpression(statement.expression)) {
              return true;
            }
            // TODO:
            warn(`Statement ${chalk.cyan(value)} is not handled yet.`);
            return false;
          })
          .map((statement) => statement.expression);

        if (expressions.length === 0) {
          path.remove();
          return;
        }

        let handlerStatements = expressions
          .map((expression) => {
            return t.expressionStatement(expression);
          })
          .filter(Boolean);

        let requiresEvent = false;
        if (modifiers.includes("prevent")) {
          requiresEvent = true;
          handlerStatements.unshift(
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(t.identifier("event"), t.identifier("preventDefault")),
                []
              )
            )
          );
        }

        if (modifiers.includes("stop")) {
          requiresEvent = true;
          handlerStatements.unshift(
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(t.identifier("event"), t.identifier("stopPropagation")),
                []
              )
            )
          );
        }

        if (modifiers.includes("space")) {
          requiresEvent = true;
          const ifStatement = parse(`if (event.key === " ") {}`).program.body[0];
          ifStatement.consequent.body = handlerStatements;
          handlerStatements = [ifStatement];
        }
        if (modifiers.includes("enter")) {
          requiresEvent = true;
          const ifStatement = parse(`if (event.key === "Enter") {}`).program.body[0];
          ifStatement.consequent.body = handlerStatements;
          handlerStatements = [ifStatement];
        }
        if (modifiers.includes("escape")) {
          requiresEvent = true;
          const ifStatement = parse(`if (event.key === "Escape") {}`).program.body[0];
          ifStatement.consequent.body = handlerStatements;
          handlerStatements = [ifStatement];
        }
        if (modifiers.includes("arrow-up")) {
          requiresEvent = true;
          const ifStatement = parse(`if (event.key === "ArrowUp") {}`).program.body[0];
          ifStatement.consequent.body = handlerStatements;
          handlerStatements = [ifStatement];
        }
        if (modifiers.includes("arrow-down")) {
          requiresEvent = true;
          const ifStatement = parse(`if (event.key === "ArrowDown") {}`).program.body[0];
          ifStatement.consequent.body = handlerStatements;
          handlerStatements = [ifStatement];
        }
        if (modifiers.includes("away")) {
          requiresEvent = true;
          const awayRef = path.scope.generateUidIdentifier("awayRef");
          path.scope.push({
            kind: "const",
            id: awayRef,
            init: t.callExpression(t.identifier("useRef"), []),
            unique: true,
          });
          path.replaceWith(
            t.jsxAttribute(t.jsxIdentifier("ref"), t.jsxExpressionContainer(awayRef))
          );
          const ifStatement = parse(
            `if (!${awayRef.name}.current || !${awayRef.name}.current.contains(event.target)) {}`
          ).program.body[0];
          ifStatement.consequent.body = handlerStatements;
          handlerStatements = [ifStatement];
        }

        const handledModifiers = [
          "window",
          "prevent",
          "stop",
          "space",
          "enter",
          "escape",
          "arrow-up",
          "arrow-down",
          "away",
        ];
        for (let modifier of modifiers) {
          if (!handledModifiers.includes(modifier)) {
            warn(`Unhandled modifier ${chalk.cyan(modifier)}.`);
          }
        }

        const handler = t.arrowFunctionExpression(
          requiresEvent ? [t.identifier("event")] : [],
          t.blockStatement(handlerStatements)
        );

        if (modifiers.includes("window")) {
          const useEffect = parse(`useEffect(() => {
              const listener = handler;
              window.addEventListener("${event}", listener);
              return () => window.removeEventListener("${event}", listener);
            }, []);`).program.body[0];
          useEffect.expression.arguments[0].body.body[0].declarations[0].init = handler;
          /** @type {babel.NodePath[]} */
          const [handlerPath] = path.scope.path.get("body").unshiftContainer("body", useEffect);
          handlerPath.traverse(replaceXDataAssignment(babel), params);
          handlerPath.traverse(replaceXDataIdentifier(babel), params);
          path.remove();
          return;
        }
        if (modifiers.includes("away")) {
          const useEffect = parse(`useEffect(() => {
              const listener = handler;
              window.addEventListener("${event}", listener);
              return () => window.removeEventListener("${event}", listener);
            }, []);`).program.body[0];
          useEffect.expression.arguments[0].body.body[0].declarations[0].init = handler;
          /** @type {babel.NodePath[]} */
          const [handlerPath] = path.scope.path.get("body").unshiftContainer("body", useEffect);
          handlerPath.traverse(replaceXDataAssignment(babel), params);
          handlerPath.traverse(replaceXDataIdentifier(babel), params);
          return;
        }

        const eventNameMapping = {
          keyup: "keyUp",
          keydown: "keyDown",
          mouseenter: "mouseEnter",
          mouseleave: "mouseLeave",
        };
        const eventHandlerAttribute = `on${upperFirst(eventNameMapping[event] || event)}`;

        const siblings = [...path.getAllPrevSiblings(), ...path.getAllNextSiblings()];
        const existingEventHandler = siblings.find(
          (sibling) =>
            t.isJSXAttribute(sibling.node) &&
            t.isJSXExpressionContainer(sibling.node.value) &&
            sibling.node.name.name === eventHandlerAttribute
        );
        if (
          existingEventHandler &&
          t.isJSXAttribute(existingEventHandler.node) &&
          t.isJSXExpressionContainer(existingEventHandler.node.value) &&
          t.isArrowFunctionExpression(existingEventHandler.node.value.expression) &&
          t.isBlockStatement(existingEventHandler.node.value.expression.body)
        ) {
          // Add event as a parameter if required
          if (existingEventHandler.node.value.expression.params.length === 0 && requiresEvent) {
            existingEventHandler.node.value.expression.params.push(t.identifier("event"));
          }
          // Append handler statements to the existing handler
          existingEventHandler.node.value.expression.body.body = existingEventHandler.node.value.expression.body.body.concat(
            handlerStatements
          );
          existingEventHandler.traverse(replaceXDataAssignment(babel), params);
          existingEventHandler.traverse(replaceXDataIdentifier(babel), params);
          path.remove();
        } else {
          path.replaceWith(
            t.jsxAttribute(
              t.jsxIdentifier(eventHandlerAttribute),
              t.jsxExpressionContainer(handler)
            )
          );
          path.traverse(replaceXDataAssignment(babel), params);
          path.traverse(replaceXDataIdentifier(babel), params);
        }
      }
    },
  };
};
