const sanitizeClassNames = (classNames) => {
  return classNames
    .filter((className) => {
      return (
        // Remove typo in "Marketing › Page Sections › Pricing Sections › Three tiers with emphasized tier"
        className !== "mt-" &&
        // Remove typo in "Marketing › Page Sections › Hero Sections"
        className !== "xl:transform-none" &&
        // Remove typo in "Application UI › Overlays › Slide-overs › Wide create project form example"
        className !== "space-between" &&
        className !== "sm:space-between" &&
        // Remove typo in "Application UI › Forms › Sign-in and Registration › Simple Card"
        className !== "max-w" &&
        // Remove typo in "Marketing › Page Sections › Pricing Sections"
        className !== "5"
      );
    })
    .map((className) => {
      // Fix typo in "Application UI › Forms › Action Panels › With toggle"
      if (className === "flex-no-shrink") {
        return "flex-shrink-0";
      }
      // Fix typo in "Application UI › Page Examples › Home Screens › Full-width with sidebar"
      if (className === "order-0") {
        return "order-none";
      }
      if (className === "sm:order-0") {
        return "sm:order-none";
      }
      // Fix typo in "Marketing › Page Examples › Pricing Pages" and "Marketing › Page Sections › Pricing Sections"
      if (className === "sm:align-center") {
        return "sm:items-center";
      }
      // Fix typo in "Application UI › Forms › Toggles"
      if (className === "-mx-auto") {
        return "mx-auto";
      }
      return className;
    });
};

/**
 * `className="..."` -> `tw="..."`
 * `className="group ..."` -> `className="group" tw="..."`
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const className = ({ types: t }) => ({
  visitor: {
    JSXAttribute(path) {
      if (path.node.name.name === "className") {
        if (path.node.value === null) {
          path.remove();
          return;
        }
        if (path.node.value.value === "group") {
          path.skip();
          return;
        }
        const classNames = sanitizeClassNames(path.node.value.value.split(" "));
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
});
