import { transformAsync } from "@babel/core";
import babelPresetReact from "@babel/preset-react";
import { generateImports } from "./codemods/generateImports";

export const transform = async (componentCode) => {
  const template = `
  ${generateImports(componentCode, { type: "umd" })}
  const { hydrate, render } = ReactDOM;

  ${componentCode}

  const App = () => {
    return (
      <ReactErrorBoundary.ErrorBoundary fallback={<span>Error while rendering component</span>} onError={(error) => window.postMessage({ type: "PREVIEW_ERROR", payload: error })}>
        <Component />
      </ReactErrorBoundary.ErrorBoundary>
    );
  };

  const rootElement = document.getElementById("root");
  if (rootElement.hasChildNodes()) {
    hydrate(<App />, rootElement);
  } else {
    render(<App />, rootElement);
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
