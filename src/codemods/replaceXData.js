import * as t from "@babel/types";
import { upperFirst } from "../shared/upperFirst";

const warn = (caller, message) => console.warn(`${caller}[replace-x-data] ${message}`);

/** @type {import("@babel/core").Visitor} */
export const replaceXDataIdentifier = {
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
};

/** @type {import("@babel/core").Visitor} */
export const replaceXDataAssignment = {
  AssignmentExpression(path, { caller, mappings }) {
    if (t.isIdentifier(path.node.left)) {
      // Apply replacements in expression like `open = true`
      const state = path.node.left.name;
      const setState = `set${upperFirst(state)}`;
      const _setState = mappings[setState];
      if (!_setState) {
        warn(caller, `State ${state} is not declared.`);
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
        warn(caller, `State ${state} is not declared.`);
        return;
      }
      path.replaceWith(t.expressionStatement(t.callExpression(_setState, [path.node.right])));
      return;
    }
  },
};
