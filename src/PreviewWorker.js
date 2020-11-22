import { transformAsync } from "@babel/core";
import babelPresetReact from "@babel/preset-react";
import { generateImports } from "./codemods/generateImports";

export const transform = async (componentCode) => {
  const template = `
  ${generateImports(componentCode, { type: "umd" })}
  const { hydrate, render } = ReactDOM;

  ${componentCode}

  const rootElement = document.getElementById("root");
  if (rootElement.hasChildNodes()) {
    hydrate(<Component />, rootElement);
  } else {
    render(<Component />, rootElement);
  }`;
  const { code } = await transformAsync(template, {
    presets: [
      [
        babelPresetReact,
        {
          runtime: "classic",
        },
      ],
    ],
  });
  return code;
};
