import { transformAsync } from "@babel/core";
import buildAllSyntaxPlugin from "@codemod/core/src/AllSyntaxPlugin";
import RecastPlugin from "@codemod/core/src/RecastPlugin";
import { xData } from "./xData";

const transform = async (code) => {
  return transformAsync(code, {
    plugins: [xData, buildAllSyntaxPlugin("unambiguous"), RecastPlugin],
  });
};

test("should replace attribute with className and clsx expression", async () => {
  const { code } = await transform(`const Component = () => {
  return <div x-data="{ open: true }" x-show="open" />;
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_open, _setOpen] = useState(true);\r
  return (\r
    <div\r
      className={clsx({\r
        "hidden": !_open\r
      })} />\r
  );\r
}`);
});

test("should merge with existing className attribute", async () => {
  const { code } = await transform(`const Component = () => {
  return <div className="text-gray-500" x-data="{ open: true }" x-show="open" />;
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_open, _setOpen] = useState(true);\r
  return (\r
    <div\r
      className={clsx("text-gray-500", {\r
        "hidden": !_open\r
      })} />\r
  );\r
}`);
});

test("should merge with existing className with clsx expression", async () => {
  const { code } = await transform(`const Component = () => {
  return <div className={clsx({ "text-gray-500": true })} x-data="{ open: true }" x-show="open" />;
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_open, _setOpen] = useState(true);\r
  return (\r
    <div\r
      className={clsx({ "text-gray-500": true }, {\r
        "hidden": !_open\r
      })} />\r
  );\r
}`);
});