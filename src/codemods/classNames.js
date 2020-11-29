// @ts-check
import { types as t } from "@babel/core";

/**
 * @type {(babel: import("@babel/core"), options?: { preset?: import("./convertComponent").TailwindToReactPreset }) => import("@babel/core").PluginObj}
 */
export const classNames = (_, { preset = "clsx" } = {}) => {
  if (preset === "twin.macro") {
    return {
      visitor: {
        JSXAttribute(path) {
          if (
            t.isJSXIdentifier(path.node.name) &&
            t.isStringLiteral(path.node.value) &&
            path.node.name.name === "className"
          ) {
            if (path.node.value === null) {
              path.remove();
              return;
            }
            if (path.node.value.value === "group") {
              path.skip();
              return;
            }
            const classNames = path.node.value.value.split(" ");
            // if className container "group" replace with className and tw
            if (classNames.includes("group")) {
              path.replaceWithMultiple([
                t.jsxAttribute(t.jsxIdentifier("className"), t.stringLiteral("group")),
                t.jsxAttribute(
                  t.jsxIdentifier("tw"),
                  t.stringLiteral(classNames.filter((className) => className !== "group").join(" "))
                ),
              ]);
              return;
            }
            path.replaceWith(
              t.jsxAttribute(t.jsxIdentifier("tw"), t.stringLiteral(classNames.join(" ")))
            );
            return;
          }
        },
      },
    };
  }
  return {
    visitor: {},
  };
};
