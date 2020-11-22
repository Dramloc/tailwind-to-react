import { transformAsync } from "@babel/core";
import buildAllSyntaxPlugin from "@codemod/core/src/AllSyntaxPlugin";
import RecastPlugin from "@codemod/core/src/RecastPlugin";
import { xDescription } from "./xDescription";

const transform = async (code) => {
  return transformAsync(code, {
    plugins: [xDescription, buildAllSyntaxPlugin("unambiguous"), RecastPlugin],
  });
};

test("should create a comment block before JSXElement if it has a x-description attribute", async () => {
  const { code } = await transform('<><div x-description="Some description" /></>');
  expect(code).toStrictEqual("<>\r\n  {/* Some description */\r\n  }\r\n  <div /></>");
});

test("should create a comment block before JSXElement if it has a x-descriptions attribute", async () => {
  const { code } = await transform('<><div x-descriptions="Some description" /></>');
  expect(code).toStrictEqual("<>\r\n  {/* Some description */\r\n  }\r\n  <div /></>");
});
