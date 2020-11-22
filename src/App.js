import clsx from "clsx";
import { useState } from "react";
import { usePaginatedQuery } from "react-query";
// eslint-disable-next-line import/no-webpack-loader-syntax
import ConvertComponentWorker from "workerize-loader!./ConvertComponentWorker";
// eslint-disable-next-line import/no-webpack-loader-syntax
import PrettierWorker from "workerize-loader!./PrettierWorker";
import { CodeEditor } from "./CodeEditor";
import { generateImports } from "./codemods/generateImports";
import { example } from "./example.js";
import { Preview } from "./Preview";
import { ColorModeProvider } from "./shared/ColorModeProvider";
import { Layout } from "./shared/Layout";
import { useDebounce } from "./shared/useDebounce";

const convertComponentWorker = ConvertComponentWorker();
const prettierWorker = PrettierWorker();

/** @type {(html: string) => import("react-query").PaginatedQueryResult<string>} */
const useConvertComponentQuery = (html) => {
  return usePaginatedQuery(["convert", html], async () => convertComponentWorker.convert(html));
};

/** @type {(source: string) => import("react-query").PaginatedQueryResult<string>} */
const usePrettierQuery = (source) => {
  return usePaginatedQuery(["prettier", source], async () => prettierWorker.format(source), {
    enabled: source,
  });
};

const App = () => {
  const [input, setInput] = useState(example);
  const debouncedInput = useDebounce(input, 500);

  const { resolvedData: convertedComponent } = useConvertComponentQuery(debouncedInput);
  const { resolvedData: prettifiedComponent } = usePrettierQuery(
    convertedComponent
      ? `${generateImports(convertedComponent, { type: "esm" })}\n\nexport ${convertedComponent}`
      : null
  );
  const [selectedTab, setSelectedTab] = useState("input");

  return (
    <>
      <ColorModeProvider>
        <Layout>
          <main className="flex-1 grid grid-rows-1 grid-cols-1 sm:grid-cols-2 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
              <div className="flex items-center -mt-px flex-none pl-5 pr-4 sm:pl-6">
                <div className="flex space-x-5">
                  <button
                    type="button"
                    className={clsx(
                      "flex text-xs leading-4 font-medium px-0.5 border-t-2 focus:outline-none transition-colors duration-150",
                      {
                        "border-primary-500 text-gray-900 dark:text-white": selectedTab === "input",
                        "border-transparent text-gray-500 hover:text-gray-900 focus:text-gray-900 dark:text-gray-400 dark:hover:text-white":
                          selectedTab !== "input",
                      }
                    )}
                    onClick={() => setSelectedTab("input")}
                  >
                    <span className="border-b-2 border-transparent py-2.5">Input</span>
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      "flex text-xs leading-4 font-medium px-0.5 border-t-2 focus:outline-none transition-colors duration-150",
                      {
                        "border-primary-500 text-gray-900 dark:text-white":
                          selectedTab === "output",
                        "border-transparent text-gray-500 hover:text-gray-900 focus:text-gray-900 dark:text-gray-400 dark:hover:text-white":
                          selectedTab !== "output",
                      }
                    )}
                    onClick={() => setSelectedTab("output")}
                  >
                    <span className="border-b-2 border-transparent py-2.5">Output</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-800">
                <CodeEditor
                  value={input}
                  onChange={setInput}
                  language="html"
                  className={clsx({ hidden: selectedTab !== "input" })}
                />
              </div>
              {prettifiedComponent && (
                <CodeEditor
                  value={prettifiedComponent}
                  options={{ readOnly: true }}
                  language="javascript"
                  className={clsx({ hidden: selectedTab !== "output" })}
                />
              )}
            </div>
            <div className="relative col-span-1 order-last sm:order-1 row-span-2">
              <Preview code={convertedComponent} />
            </div>
          </main>
        </Layout>
      </ColorModeProvider>
    </>
  );
};

export default App;
