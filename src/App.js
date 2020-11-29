// @ts-check
/** @jsxImportSource @emotion/react */
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import example from "raw-loader!./examples/welcome.html";
import { useState } from "react";
import { useQuery } from "react-query";
import "twin.macro";
import { CodeEditor } from "./CodeEditor";
import { generateImports } from "./codemods/generateImports";
import { ExampleDropdown } from "./examples/ExampleDropdown";
import { Preview } from "./Preview";
import { ColorModeSwitch } from "./shared/ColorModeSwitch";
import { ErrorOverlay } from "./shared/ErrorOverlay";
import { Navbar } from "./shared/Navbar";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "./shared/Tabs";
import { useDebounce } from "./shared/useDebounce";
import { useMedia } from "./shared/useMedia";
import { babelWorker, prettierWorker } from "./workers";

/** @type {(options: import("./codemods/convertComponent").ConvertComponentOptions) => import("react-query").QueryResult<string>} */
const useConvertComponentQuery = (options) => {
  return useQuery(["convert", options], async () => babelWorker.convert(options));
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
  const [preset] = useState(
    /** @type {import("./codemods/convertComponent").TailwindToReactPreset} */ ("clsx")
  );

  const { status, data: convertedComponent, error } = useConvertComponentQuery({
    html: debouncedInput,
    preset,
    name: "Component",
  });
  const { data: prettifiedComponent } = usePrettierQuery(
    convertedComponent
      ? `${generateImports(convertedComponent, {
          type: "esm",
          preset,
        })}\n\nexport ${convertedComponent}`
      : null
  );

  const isMd = useMedia(["(min-width: 768px)"], [true], false);

  const preview = (
    <div tw="relative w-full h-full">
      <Preview code={convertedComponent} preset={preset} isInputLoading={status === "loading"} />
      <ErrorOverlay origin="Conversion" error={error} />
    </div>
  );

  return (
    <>
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

      <main tw="flex-1 grid grid-cols-1 md:grid-cols-2 border-t border-gray-200 dark:border-gray-800">
        {/* Left-side editor panel */}
        <Tabs>
          <TabList>
            <Tab>Input</Tab>
            <Tab>Output</Tab>
            {!isMd && <Tab>Preview</Tab>}
          </TabList>
          <TabPanels>
            {/* Input tab */}
            <TabPanel>
              <CodeEditor value={input} onChange={setInput} language="html" />
            </TabPanel>
            {/* Ouput tab */}
            <TabPanel>
              {prettifiedComponent && (
                <CodeEditor
                  value={prettifiedComponent}
                  options={{ readOnly: true }}
                  language="javascript"
                />
              )}
            </TabPanel>
            {/* Preview tab, only visible on smaller breakpoints */}
            {!isMd && <TabPanel>{preview}</TabPanel>}
          </TabPanels>
        </Tabs>
        {/* Right-side preview panel, only visible on larger breakpoints */}
        {isMd && preview}
      </main>
    </>
  );
};

export default App;
