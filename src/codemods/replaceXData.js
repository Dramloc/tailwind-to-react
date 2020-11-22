import chalk from "chalk";
import { upperFirst } from "../shared/upperFirst";

const warn = (caller, message) =>
  console.warn(`    ${chalk.yellow("⚠")} ${chalk.gray(`${caller}[replace-x-data]`)} ${message}`);

/**
 * @type {(babel: globalThis.babel) => babel.Visitor}
 */
export const replaceXDataIdentifier = ({ types: t }) => ({
  MemberExpression(path, { mappings }) {
    if (t.isThisExpression(path.node.object)) {
      const _state = mappings[path.node.property.name];
      if (t.isIdentifier(_state)) {
        path.replaceWith(_state);
      }
    }
  },
  Identifier(path, { mappings }) {
    const _state = mappings[path.node.name];
    if (t.isIdentifier(_state)) {
      path.replaceWith(_state);
    }
  },
});

/**
 * @type {(babel: globalThis.babel) => babel.Visitor}
 */
export const replaceXDataAssignment = ({ types: t }) => ({
  AssignmentExpression(path, { caller, mappings }) {
    if (t.isIdentifier(path.node.left)) {
      // Apply replacements in expression like `open = true`
      const state = path.node.left.name;
      const setState = `set${upperFirst(state)}`;
      const _setState = mappings[setState];
      if (!_setState) {
        warn(caller, `State ${chalk.cyan(state)} is not declared.`);
        path.remove();
        return;
      }
      path.replaceWith(t.callExpression(_setState, [path.node.right]));
      return;
    }
    if (t.isMemberExpression(path.node.left) && t.isThisExpression(path.node.left.object)) {
      // Apply replacements in expression like `this.open = ...`
      const state = path.node.left.property.name;
      const setState = `set${upperFirst(state)}`;
      const _setState = mappings[setState];
      if (!_setState) {
        warn(caller, `isMemberExpression State ${chalk.cyan(state)} is not declared.`);
        return;
      }
      path.replaceWith(t.expressionStatement(t.callExpression(_setState, [path.node.right])));
      return;
    }
  },
});
