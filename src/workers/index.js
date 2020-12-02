/* eslint-disable import/no-webpack-loader-syntax */
import { useQuery } from "react-query";
import ConfigWorker from "workerize-loader!./ConfigWorker";
import CSSWorker from "workerize-loader!./CSSWorker";
import JSWorker from "workerize-loader!./JSWorker";
import PrettierWorker from "workerize-loader!./PrettierWorker";

/** @type {{ convertComponent: import("./JSWorker").ConvertComponent, compileJS: import("./JSWorker").CompileJS }} */
const jsWorker = JSWorker();

/** @type {(options: import("../codemods/convertComponent").ConvertComponentOptions) => import("react-query").QueryResult<string>} */
export const useConvertComponentQuery = (options) => {
  return useQuery(["convertComponent", options], async () => jsWorker.convertComponent(options));
};

/** @type {(options: import("./JSWorker").CompileJSOptions) => import("react-query").QueryResult<string>} */
export const useCompileJSQuery = (options) => {
  return useQuery(["compileJS", options], async () => jsWorker.compileJS(options), {
    enabled: options.code && options.tailwindConfig,
  });
};

/** @type {{ compileCSS: import("./CSSWorker").CompileCSS }} */
const cssWorker = CSSWorker();

/** @type {(options: import("./CSSWorker").CompileCSSOptions) => import("react-query").QueryResult<string>} */
export const useCompileCSSQuery = (options) => {
  return useQuery(["compileCSS", options], async () => cssWorker.compileCSS(options), {
    enabled: options.tailwindConfig,
  });
};

/** @type {{ compileConfig: import("./ConfigWorker").CompileConfig }} */
const configWorker = ConfigWorker();

/** @type {(tailwindConfig: string) => import("react-query").QueryResult<string>} */
export const useCompileConfigQuery = (tailwindConfig) => {
  return useQuery(["compileConfig", tailwindConfig], async () =>
    configWorker.compileConfig(tailwindConfig)
  );
};

/** @type {{ format: (string) => Promise<string> }} */
const prettierWorker = PrettierWorker();

/** @type {(source: string) => import("react-query").QueryResult<string>} */
export const usePrettierQuery = (source) => {
  return useQuery(["prettier", source], async () => prettierWorker.format(source), {
    enabled: source,
  });
};
