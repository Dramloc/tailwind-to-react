import { transformAsync } from "@babel/core";
import buildAllSyntaxPlugin from "@codemod/core/src/AllSyntaxPlugin";
import RecastPlugin from "@codemod/core/src/RecastPlugin";
import { reorderJSXAttributes } from "./reorderJSXAttributes";

const transform = async (code) => {
  return transformAsync(code, {
    plugins: [reorderJSXAttributes, buildAllSyntaxPlugin("unambiguous"), RecastPlugin],
  });
};

test("should put x-data before all properties", async () => {
  const { code } = await transform('<div x-on:click="open = false" x-data="{ open: true }" />');
  expect(code).toStrictEqual('<div x-data="{ open: true }" x-on:click="open = false" />');
});

test("should put x-ref before all properties", async () => {
  const { code } = await transform('<div x-on:click="open=false" x-ref="listbox" />');
  expect(code).toStrictEqual('<div x-ref="listbox" x-on:click="open=false" />');
});

test("should put x-ref before x-data", async () => {
  const { code } = await transform('<div x-data="{ open: true }" x-ref="listbox" />');
  expect(code).toStrictEqual('<div x-ref="listbox" x-data="{ open: true }" />');
});

test("should put x-ref first, followed by x-data, followed by other properties", async () => {
  const { code } = await transform(
    '<div x-on:click="open = false" x-data="{ open: true }" x-ref="listbox" />'
  );
  expect(code).toStrictEqual(
    '<div x-ref="listbox" x-data="{ open: true }" x-on:click="open = false" />'
  );
});
