// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import BabelWorker from "workerize-loader!./BabelWorker";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import PrettierWorker from "workerize-loader!./PrettierWorker";

export const babelWorker = BabelWorker();
export const prettierWorker = PrettierWorker();
