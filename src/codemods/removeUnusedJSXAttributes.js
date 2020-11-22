// @ts-check
import { isJSXAttributeWithName, isJSXAttributeWithNamespace } from "./utils";

/**
 * Remove unused Alpine JSX attributes (x-cloak, x-max, x-state).
 * This is mainly used to cleanup the JSX tree.
 * @type {() => import("@babel/core").PluginObj}
 */
export const removeUnusedJSXAttributes = () => ({
  visitor: {
    JSXAttribute(path) {
      if (
        isJSXAttributeWithName("x-cloak")(path.node) ||
        isJSXAttributeWithName("x-max")(path.node) ||
        isJSXAttributeWithNamespace("x-state")(path.node)
      ) {
        path.remove();
      }
    },
  },
});
