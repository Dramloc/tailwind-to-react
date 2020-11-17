/**
 * @type {(babel: globalThis.babel) => babel.PluginObj}
 */
export const tailwindSelectMenuButton = ({ types: t, parse }) => ({
  visitor: {
    JSXAttribute(path) {
      if (
        t.isJSXIdentifier(path.node.name) &&
        path.node.name.name === "x-data" &&
        t.isStringLiteral(path.node.value) &&
        path.node.value.value === "Components.customSelect({ open: true, value: 3, selected: 3 })"
      ) {
        path.replaceWith(
          t.jsxAttribute(
            t.jsxIdentifier("x-data"),
            t.stringLiteral("{ open: true, value: 3, selected: 3 }")
          )
        );
        return;
      }
      if (path.node.name.name === "x-ref" && path.node.value.value === "button") {
        path.scope.push({
          kind: "const",
          id: t.identifier("buttonRef"),
          init: t.callExpression(t.identifier("useRef"), []),
          unique: true,
        });
        const buttonHandlerStatements = parse(`
const activeDescendant = useMemo(() => {
  if (_selected === null || !listboxRef.current) {
    return "";
  }
  return listboxRef.current.children[_selected].id;
}, [_selected]);

useEffect(() => {
  if (_selected !== null && listboxRef.current) {
    listboxRef.current.children[_selected].scrollIntoView({
      block: "nearest",
    });
  }
}, [_selected]);

const choose = (index) => {
  _setValue(index);
  _setOpen(false);
};

const onButtonClick = () => {
  if (!_open) {
    _setSelected(_value);
    _setOpen(true);
    listboxRef.current.focus();
  }
};

const onOptionSelect = () => {
  if (_selected !== null) {
    _setValue(_selected);
  }
  _setOpen(false);
  buttonRef.current.focus();
};

const onEscape = () => {
  _setOpen(false);
  buttonRef.current.focus();
};

const onArrowUp = () => {
  const optionCount = listboxRef.current.children.length;
  const selectedValue = _selected - 1 < 0 ? optionCount - 1 : _selected - 1;
  _setSelected(selectedValue);
};

const onArrowDown = () => {
  const optionCount = listboxRef.current.children.length;
  const selectedValue = _selected + 1 > optionCount - 1 ? 1 : _selected + 1;
  _setSelected(selectedValue);
};
        `).program.body;
        path.scope.path.get("body").unshiftContainer("body", buttonHandlerStatements);
        path.replaceWith(
          t.jsxAttribute(
            t.jsxIdentifier("ref"),
            t.jsxExpressionContainer(t.identifier("buttonRef"))
          )
        );
      }
    },
  },
});
