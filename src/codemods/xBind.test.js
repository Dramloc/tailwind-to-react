import { transformAsync } from "@babel/core";
import pluginSyntaxJsx from "@babel/plugin-syntax-jsx";
import { recastPlugin } from "./convertComponent";
import { xData } from "./xData";

const transform = async (code) => {
  return transformAsync(code, {
    plugins: [xData, pluginSyntaxJsx, recastPlugin],
  });
};

test("should replace x-bind attribute with the attribute name and the expression", async () => {
  const { code } = await transform(`const Component = () => {
  return (
    <div x-data="{ expanded: true }" x-bind:aria-expanded="expanded" />
  );
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_expanded, _setExpanded] = useState(true);\r
  return <div aria-expanded={_expanded} />;\r
}`);
});

test("should replace existing attributes with the same name", async () => {
  const { code } = await transform(`const Component = () => {
  return (
    <div x-data="{ expanded: true }" aria-expanded="true" x-bind:aria-expanded="expanded" />
  );
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_expanded, _setExpanded] = useState(true);\r
  return <div aria-expanded={_expanded} />;\r
}`);
});

test("should replace x-bind:class attribute with a className and a clsx expression", async () => {
  const { code } = await transform(`const Component = () => {
  return (
    <div x-data="{ expanded: true }" x-bind:class="{ 'block bg-white': expanded, hidden: !expanded }" />
  );
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_expanded, _setExpanded] = useState(true);\r
  return (\r
    <div\r
      className={clsx({\r
        "block bg-white": _expanded,\r
        hidden: !_expanded\r
      })} />\r
  );\r
}`);
});

test("should merge clsx expression with existing className", async () => {
  const { code } = await transform(`const Component = () => {
  return (
    <div className="text-gray-500" x-data="{ expanded: true }" x-bind:class="{ 'block bg-white': expanded, hidden: !expanded }" />
  );
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_expanded, _setExpanded] = useState(true);\r
  return (\r
    <div\r
      className={clsx("text-gray-500", {\r
        "block bg-white": _expanded,\r
        hidden: !_expanded\r
      })} />\r
  );\r
}`);
});

test("should merge clsx expression with existing clsx expression", async () => {
  const { code } = await transform(`const Component = () => {
  return (
    <div className={clsx({ "text-gray": true })} x-data="{ expanded: true }" x-bind:class="{ 'block bg-white': expanded, hidden: !expanded }" />
  );
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_expanded, _setExpanded] = useState(true);\r
  return (\r
    <div\r
      className={clsx({ "text-gray": true }, {\r
        "block bg-white": _expanded,\r
        hidden: !_expanded\r
      })} />\r
  );\r
}`);
});
