/** @jsxImportSource @emotion/react */
// eslint-disable-next-line import/no-webpack-loader-syntax
import example from "raw-loader!../examples/welcome.html";
import { useState } from "react";
import "twin.macro";
import { generateImports } from "../codemods/generateImports";
import { ExampleDropdown } from "../examples/ExampleDropdown";
import { ColorModeSwitch } from "../shared/ColorModeSwitch";
import { Navbar } from "../shared/Navbar";
import { Select, SelectOption } from "../shared/Select";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "../shared/Tabs";
import { useDebounce } from "../shared/useDebounce";
import { useLocalStorage } from "../shared/useLocalStorage";
import { useMedia } from "../shared/useMedia";
import { useConvertComponentQuery, usePrettierQuery } from "../workers";
import { CodeEditor } from "./CodeEditor";
import { ErrorOverlay } from "./ErrorOverlay";
import { Preview } from "./Preview";

const defaultTailwindConfig = `const colors = require("tailwindcss/colors");

module.exports = {
  darkMode: false,
  theme: {
    extend: {
      colors: {
        primary: colors.cyan
      },
    },
  },
  variants: {},
  plugins: [
    require("@tailwindcss/forms"),
  ],
};
`;

const App = () => {
  const [input, setInput] = useState(example);
  const debouncedInput = useDebounce(input, 500);
  const [tailwindConfig, setTailwindConfig] = useState(defaultTailwindConfig);
  const debouncedTailwindConfig = useDebounce(tailwindConfig, 500);
  const [preset, setPreset] = useLocalStorage(
    "preset",
    /** @type {import("../codemods/convertComponent").TailwindToReactPreset} */ ("clsx")
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
      <Preview
        code={convertedComponent}
        tailwindConfig={debouncedTailwindConfig}
        preset={preset}
        isConverting={status === "loading"}
      />
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
        end={
          <>
            <Select value={preset} onChange={setPreset}>
              <SelectOption value="clsx">clsx</SelectOption>
              <SelectOption value="twin.macro">twin.macro</SelectOption>
            </Select>
            <ColorModeSwitch />
          </>
        }
      />

      <main tw="flex-1 grid grid-cols-1 md:grid-cols-2 border-t border-gray-200 dark:border-gray-800">
        {/* Left-side editor panel */}
        <Tabs>
          <TabList>
            <Tab>Input</Tab>
            <Tab>Config</Tab>
            <Tab>Output</Tab>
            {!isMd && <Tab>Preview</Tab>}
          </TabList>
          <TabPanels>
            {/* Input tab */}
            <TabPanel>
              <CodeEditor value={input} onChange={setInput} language="html" />
            </TabPanel>
            {/* Config tab */}
            <TabPanel>
              <CodeEditor
                value={tailwindConfig}
                onChange={setTailwindConfig}
                language="javascript"
              />
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
