import prettier from "prettier";
import parserBabel from "prettier/parser-babel";

export const format = (source) => {
  return prettier.format(source, {
    parser: "babel",
    plugins: [parserBabel],
    printWidth: 100,
  });
};
