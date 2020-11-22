import { transformAsync } from "@babel/core";
import buildAllSyntaxPlugin from "@codemod/core/src/AllSyntaxPlugin";
import RecastPlugin from "@codemod/core/src/RecastPlugin";
import { removeUnusedJSXAttributes } from "./removeUnusedJSXAttributes";

const transform = async (code) => {
  return transformAsync(code, {
    plugins: [removeUnusedJSXAttributes, buildAllSyntaxPlugin("unambiguous"), RecastPlugin],
  });
};

test("should remove x-cloak attributes", async () => {
  const { code } = await transform('<div x-cloak="any" />');
  expect(code).toStrictEqual("<div />");
});

test("should remove x-max attributes", async () => {
  const { code } = await transform('<div x-max="any" />');
  expect(code).toStrictEqual("<div />");
});

test("should remove 'x-state'-namespaced attributes", async () => {
  const { code } = await transform('<div x-state:on="any" />');
  expect(code).toStrictEqual("<div />");
});

test("should keep other attributes", async () => {
  const { code } = await transform(
    '<div x-cloak="any" x-max="any" x-state:on="any" keepMePlease />'
  );
  expect(code).toStrictEqual("<div keepMePlease />");
});
