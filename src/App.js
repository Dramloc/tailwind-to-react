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
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "./shared/Tabs";
import { useDebounce } from "./shared/useDebounce";
import { useMedia } from "./shared/useMedia";

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

  const isMd = useMedia(["(min-width: 768px)"], [true], false);

  return (
    <>
      <ColorModeProvider>
        <Layout>
          <main className="flex-1 grid grid-cols-1 md:grid-cols-2 border-t border-gray-200 dark:border-gray-800">
            <Tabs>
              <TabList>
                <Tab>Input</Tab>
                <Tab>Output</Tab>
                {!isMd && <Tab>Preview</Tab>}
              </TabList>
              <TabPanels>
                <TabPanel>
                  <CodeEditor value={input} onChange={setInput} language="html" />
                </TabPanel>
                <TabPanel>
                  {prettifiedComponent && (
                    <CodeEditor
                      value={prettifiedComponent}
                      options={{ readOnly: true }}
                      language="javascript"
                    />
                  )}
                </TabPanel>
                {!isMd && (
                  <TabPanel>
                    <Preview code={convertedComponent} />
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
            {isMd && <Preview code={convertedComponent} />}
          </main>
        </Layout>
      </ColorModeProvider>
    </>
  );
};

export default App;
