import { transformAsync } from "@babel/core";
import pluginSyntaxJsx from "@babel/plugin-syntax-jsx";
import HTMLtoJSX from "htmltojsx";
import { parse as recastParse, print as recastPrint } from "recast";
import { removeUnusedJSXAttributes } from "./removeUnusedJSXAttributes";
import { reorderJSXAttributes } from "./reorderJSXAttributes";
import { xData } from "./xData";
import { xDescription } from "./xDescription";
import { xInit } from "./xInit";

export const recastPlugin = () => ({
  parserOverride: (code, options, parse) => {
    return recastParse(code, {
      parser: {
        parse(code) {
          return parse(code, { ...options, tokens: true });
        },
      },
    });
  },
  generatorOverride: (ast) => {
    return recastPrint(ast, { sourceMapName: "map.json" });
  },
});

/** @type {(component: { name: string, html: string }) => Promise<import("@babel/core").BabelFileResult>} */
export const convertComponent = ({ name, html }) => {
  const jsx = new HTMLtoJSX({
    createClass: false,
  })
    .convert(html)
    // Alpine replacements
    .replace(/ :([^(="\s)]*)="/g, (_, attribute) => {
      return ` x-bind:${attribute}="`;
    })
    .replace(/ @([^(="\s)]*)="/g, (_, event) => {
      return ` x-on:${event.replace(/\./g, "$")}="`;
    });

  const componentDeclaration = `const ${name} = () => {
return (
    <>
      ${jsx}
    </>
  );
};`;

  return transformAsync(componentDeclaration, {
    plugins: [
      reorderJSXAttributes,
      removeUnusedJSXAttributes,
      xDescription,
      xData,
      xInit,
      pluginSyntaxJsx,
      recastPlugin,
    ],
  });
};
