const warn = (message) => console.warn(`[x-init] ${message}`);

/**
 * `x-init="$el.focus()"` -> `const initRef = useRef(); useEffect(() => if (initRef.current) { initRef.current.focus(); }, []); ... ref={initRef}`
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const xInit = ({ types: t, parse }) => ({
  visitor: {
    JSXAttribute(path) {
      if (path.node.name.name === "x-init") {
        const value = path.node.value.value;
        if (value === "$el.focus()") {
          const ref = path.scope.generateUidIdentifier("initRef");
          path.scope.push({
            kind: "const",
            id: ref,
            init: t.callExpression(t.identifier("useRef"), []),
            unique: true,
          });
          const useEffect = parse(`useEffect(() => {
            if (${ref.name}.current) {
              ${ref.name}.current.focus();
            }
          }, []);`).program.body[0];
          path.scope.path.get("body").unshiftContainer("body", useEffect);
          path.replaceWith(t.jsxAttribute(t.jsxIdentifier("ref"), t.jsxExpressionContainer(ref)));
          return;
        }
        // TODO:
        warn(`Directive ${value} is not handled yet.`);
        path.remove();
      }
    },
  },
});
