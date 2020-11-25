// @ts-check
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import example from "raw-loader!./examples/welcome.html";
import { useState } from "react";
import { useQuery } from "react-query";
import { CodeEditor } from "./CodeEditor";
import { generateImports } from "./codemods/generateImports";
import { ExampleDropdown } from "./examples/ExampleDropdown";
import { Preview } from "./Preview";
import { ColorModeProvider } from "./shared/ColorModeProvider";
import { ColorModeSwitch } from "./shared/ColorModeSwitch";
import { ErrorOverlay } from "./shared/ErrorOverlay";
import { Navbar } from "./shared/Navbar";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "./shared/Tabs";
import { useDebounce } from "./shared/useDebounce";
import { useMedia } from "./shared/useMedia";
import { babelWorker, prettierWorker } from "./workers";

/** @type {(html: string) => import("react-query").QueryResult<string>} */
const useConvertComponentQuery = (html) => {
  return useQuery(["convert", html], async () => babelWorker.convert(html));
};

/** @type {(source: string) => import("react-query").QueryResult<string>} */
const usePrettierQuery = (source) => {
  return useQuery(["prettier", source], async () => prettierWorker.format(source), {
    enabled: source,
  });
};

const App = () => {
  const [input, setInput] = useState(example);
  const debouncedInput = useDebounce(input, 500);

  const { status, data: convertedComponent, error } = useConvertComponentQuery(debouncedInput);
  const { data: prettifiedComponent } = usePrettierQuery(
    convertedComponent
      ? `${generateImports(convertedComponent, { type: "esm" })}\n\nexport ${convertedComponent}`
      : null
  );

  const isMd = useMedia(["(min-width: 768px)"], [true], false);

  const preview = (
    <div className="relative w-full h-full">
      <Preview code={convertedComponent} isInputLoading={status === "loading"} />
      <ErrorOverlay origin="Conversion" error={error} />
    </div>
  );

  return (
    <ColorModeProvider>
      <div className="h-screen flex overflow-hidden bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-white">
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <Navbar
            start={
              <ExampleDropdown
                onChange={async (example) => {
                  const module = await example.load();
                  setInput(module.default);
                }}
              />
            }
            end={<ColorModeSwitch />}
          />
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
                {!isMd && <TabPanel>{preview}</TabPanel>}
              </TabPanels>
            </Tabs>
            {isMd && preview}
          </main>
        </div>
      </div>
    </ColorModeProvider>
  );
};

export default App;
