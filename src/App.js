/** @jsxImportSource @emotion/react */
import { Global } from "@emotion/react";
import { useEffect, useState } from "react";
import { usePaginatedQuery } from "react-query";
import "twin.macro";
import tw, { GlobalStyles } from "twin.macro";
// eslint-disable-next-line import/no-webpack-loader-syntax
import ConvertComponentWorker from "workerize-loader!./ConvertComponentWorker";
// eslint-disable-next-line import/no-webpack-loader-syntax
import PrettierWorker from "workerize-loader!./PrettierWorker";
import CodeEditor from "./CodeEditor";
import { generateImports } from "./codemods/generateImports";
import { example } from "./example.js";
import Preview from "./Preview";
import { ColorModeProvider } from "./shared/ColorModeProvider";
import { Layout } from "./shared/Layout";

const convertComponentWorker = ConvertComponentWorker();
const prettierWorker = PrettierWorker();

const useConvertComponentQuery = (html) => {
  return usePaginatedQuery(["convert", html], async () => {
    return convertComponentWorker.convert(html);
  });
};

const usePrettierQuery = (source) => {
  return usePaginatedQuery(
    ["prettier", source],
    async () => prettierWorker.format(`${generateImports(source)}\n\nexport ${source}`),
    {
      enabled: source,
    }
  );
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const App = () => {
  const [input, setInput] = useState(example);
  const debouncedInput = useDebounce(input, 500);

  const { resolvedData: convertedComponent } = useConvertComponentQuery(debouncedInput);
  const { resolvedData: prettifiedComponent } = usePrettierQuery(convertedComponent);
  const [selectedTab, setSelectedTab] = useState("input");

  return (
    <>
      <GlobalStyles />
      <Global styles={{ body: tw`antialiased font-sans` }} />
      <ColorModeProvider>
        <Layout>
          <main tw="flex-1 grid grid-rows-1 grid-cols-1 sm:grid-cols-2 border-t border-monaco-gray-200 dark:border-monaco-gray-800">
            <div tw="flex flex-col bg-white dark:bg-monaco-gray-900 border-r border-monaco-gray-200 dark:border-monaco-gray-800">
              <div tw="flex items-center -mt-px flex-none pl-5 pr-4 sm:pl-6">
                <div tw="flex space-x-5">
                  <button
                    type="button"
                    tw="flex text-xs leading-4 font-medium px-0.5 border-t-2 focus:outline-none transition-colors duration-150"
                    css={
                      selectedTab === "input"
                        ? tw`border-teal-500 text-gray-900 dark:text-white`
                        : tw`border-transparent text-gray-500 hover:text-gray-900 focus:text-gray-900 dark:text-gray-400 dark:hover:text-white`
                    }
                    onClick={() => setSelectedTab("input")}
                  >
                    <span tw="border-b-2 border-transparent py-2.5">Input</span>
                  </button>
                  <button
                    type="button"
                    tw="flex text-xs leading-4 font-medium px-0.5 border-t-2 focus:outline-none transition-colors duration-150"
                    css={
                      selectedTab === "output"
                        ? tw`border-teal-500 text-gray-900 dark:text-white`
                        : tw`border-transparent text-gray-500 hover:text-gray-900 focus:text-gray-900 dark:text-gray-400 dark:hover:text-white`
                    }
                    onClick={() => setSelectedTab("output")}
                  >
                    <span tw="border-b-2 border-transparent py-2.5">Output</span>
                  </button>
                  <button
                    type="button"
                    tw="flex sm:hidden text-xs leading-4 font-medium px-0.5 border-t-2 focus:outline-none transition-colors duration-150"
                    css={
                      selectedTab === "preview"
                        ? tw`border-teal-500 text-gray-900 dark:text-white`
                        : tw`border-transparent text-gray-500 hover:text-gray-900 focus:text-gray-900 dark:text-gray-400 dark:hover:text-white`
                    }
                    onClick={() => setSelectedTab("preview")}
                  >
                    <span tw="border-b-2 border-transparent py-2.5">Preview</span>
                  </button>
                </div>
              </div>
              <div tw="flex-1 border-t border-monaco-gray-200 dark:border-monaco-gray-800">
                <CodeEditor
                  value={input}
                  onChange={setInput}
                  language="html"
                  css={selectedTab !== "input" && tw`hidden`}
                />
                {prettifiedComponent && (
                  <CodeEditor
                    value={prettifiedComponent}
                    options={{ readOnly: true }}
                    language="javascript"
                    css={selectedTab !== "output" && tw`hidden`}
                  />
                )}
              </div>
            </div>
            <div tw="relative col-span-1 order-last sm:order-1 row-span-2">
              <Preview code={convertedComponent} />
            </div>
          </main>
        </Layout>
      </ColorModeProvider>
    </>
  );
};

export default App;
