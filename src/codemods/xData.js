import chalk from "chalk";
import upperFirst from "lodash/fp/upperFirst";
import { replaceXDataAssignment, replaceXDataIdentifier } from "./replaceXData";
import { xBind } from "./xBind";
import { xOn } from "./xOn";
import { xShow } from "./xShow";
import { xText } from "./xText";
import { xTransition } from "./xTransition";

const warn = (message) =>
  console.warn(`    ${chalk.yellow("⚠")} ${chalk.gray("[x-data]")} ${message}`);

/**
 * Babel plugin to transform AlpineJS `x-data` JSX attribute into React `useState` statements.
 * For example, the following component:
 * ```js
 * const MyComponent = () => {
 *   return (
 *     <div x-data="{ value: 42 }">
 *     </div>
 *   );
 * }
 * ```
 * will be transformed to the following:
 * ```js
 * const MyComponent = () => {
 *   const [value, setValue] = useState(42);
 *   return (
 *     <div>
 *     </div>
 *   );
 * }
 * ```
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const xData = (babel) => {
  const { types: t, parse } = babel;
  return {
    visitor: {
      JSXAttribute(path, { mappings = {} } = {}) {
        if (t.isJSXIdentifier(path.node.name) && path.node.name.name === "x-data") {
          if (!t.isStringLiteral(path.node.value)) {
            warn("Expected x-data to be a StringLiteral");
          }
          const value = t.isStringLiteral(path.node.value) ? path.node.value.value : "{}";
          // Parse x-data expression using babel.
          // Variable declaration is used to avoid expression being interpreted as a BlockStatement.
          const parsedXData = parse(`const xData = ${value}`).program.body[0].declarations[0].init;

          if (!t.isObjectExpression(parsedXData)) {
            // Check that expression can be handled, for now expressions like x-data="radioGroup()" are not handled
            warn(`Directive ${chalk.cyan(value)} is not handled yet.`);
          }
          const properties = t.isObjectExpression(parsedXData) ? parsedXData.properties : [];

          let callbacks = [];
          // For each declared property, create a binding in the component scope.
          // This can be one of the following:
          for (let property of properties) {
            if (t.isObjectProperty(property)) {
              if (!t.isIdentifier(property.key)) {
                warn(`Expected property key to be an Identifier`);
                continue;
              }
              // ObjectProperty (e.g. `{ value: true }`):
              // - The object property is converted to a `useState` (e.g.: `const [value, setValue] = useState(true);`)
              // - A unique binding name is generated (e.g.: `value` becomes `_value` and `setValue` becoms `_setValue`)
              // - The `useState` initial state uses the value of the property
              const state = property.key.name;
              const setState = `set${upperFirst(state)}`;
              const stateIdentifier = path.scope.generateUidIdentifier(state);
              const setStateIdentifier = path.scope.generateUidIdentifier(setState);
              const initialState = property.value;
              const useState = t.identifier("useState");
              path.scope.push({
                kind: "const",
                id: t.arrayPattern([stateIdentifier, setStateIdentifier]),
                init: t.callExpression(useState, [initialState]),
                unique: true,
              });
              // Add the mapping between the original name (e.g.: `value`) and the unique binding name (e.g.: `_value`)
              // to the plugin `mappings` state.
              mappings[state] = stateIdentifier;
              mappings[setState] = setStateIdentifier;
              continue;
            }

            if (t.isObjectMethod(property)) {
              if (!t.isIdentifier(property.key)) {
                warn(`Expected property key to be an Identifier`);
                continue;
              }
              // ObjectMethod (e.g: `{ toggle() { this.value = !this.value} }`):
              // - Property is converted to a callback function (e.g.: `const toggle = () => { this.value = !this.value; })`)
              // - A unique binding name is generated (e.g.: `toggle` becomes `_toggle`)
              // - Reuse the params and body of the original function
              const callback = property.key.name;
              const callbackIdentifier = path.scope.generateUidIdentifier(callback);
              path.scope.push({
                kind: "const",
                id: callbackIdentifier,
                init: t.arrowFunctionExpression(property.params, property.body),
                unique: true,
              });

              // Add the callback to the list of callbacks that will be processed when all bindings are defined
              // (e.g.: we need to transform `const toggle = () => { this.value = !this.value; })` to `const toggle = () => setValue(!value)`)
              // We wait for all bindings to be declared as some functions might use a bindings that is declared in a property after the current callback
              // (e.g.: `{ toggle() { this.value = !this.value }, value: true }`)
              const callbackBinding = path.scope.getBinding(callbackIdentifier.name);
              callbacks.push(callbackBinding.path);

              // Add the mapping between the original name (e.g.: `toggle`) and the unique binding name (e.g.: `_toggle`)
              // to the plugin `mappings` state.
              mappings[callback] = callbackIdentifier;
              continue;
            }
          }

          path.remove();

          // For all declared callbacks, replace assignments and identifiers
          callbacks.forEach((callback) => {
            callback.traverse(replaceXDataAssignment(babel), {
              caller: "[x-data]",
              mappings,
            });
            callback.traverse(replaceXDataIdentifier(babel), {
              caller: "[x-data]",
              mappings,
            });
          });

          // Access the JSXElement
          const jsxElement = path.parentPath.parentPath;
          jsxElement.assertJSXElement();

          jsxElement.traverse(xOn(babel), { caller: "[x-on]", mappings });
          jsxElement.traverse(xShow(babel), { caller: "[x-show]", mappings });
          jsxElement.traverse(xTransition(babel), { caller: "[x-transition]", mappings });
          jsxElement.traverse(xBind(babel), { caller: "[x-bind]", mappings });
          jsxElement.traverse(xText(babel), { caller: "[x-text]", mappings });
        }
      },
    },
  };
};
