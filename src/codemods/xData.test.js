import { transformAsync } from "@babel/core";
import buildAllSyntaxPlugin from "@codemod/core/src/AllSyntaxPlugin";
import RecastPlugin from "@codemod/core/src/RecastPlugin";
import { xData } from "./xData";

const transform = async (code) => {
  return transformAsync(code, {
    plugins: [xData, buildAllSyntaxPlugin("unambiguous"), RecastPlugin],
  });
};

test("should create useState declarations in the component scope using the x-data attribute", async () => {
  const { code } = await transform(`const Component = () => {
  return <div x-data="{ open: true }" />;
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_open, _setOpen] = useState(true);\r
  return <div />;\r
}`);
});

test("should create callbacks declarations in the component scope using the x-data attribute", async () => {
  const { code } = await transform(`const Component = () => {
  return <div x-data="{ toggle(index) { return index; } }" />;
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const _toggle = index => {\r
    return index;\r
  };\r
\r
  return <div />;\r
}`);
});

test("nested x-data should declare new states", async () => {
  const { code } = await transform(`const Component = () => {
  return (
    <div x-data="{ open: true }">
      <div x-data="{ open: false }" />
    </div>
  );
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_open2, _setOpen2] = useState(false);\r
  const [_open, _setOpen] = useState(true);\r
  return (\r
    <div>\r
      <div />\r
    </div>\r
  );\r
}`);
});
