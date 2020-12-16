/** @jsxImportSource @emotion/react */
import { Global } from "@emotion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "twin.macro";
import tw from "twin.macro";
import { generateImports } from "../codemods/generateImports";
import { ColorModeSwitch } from "../shared/ColorModeSwitch";
import { ChevronLeftOutlineIcon } from "../shared/Icons";
import { Navbar } from "../shared/Navbar";
import { Select, SelectOption } from "../shared/Select";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "../shared/Tabs";
import { useDebounce } from "../shared/useDebounce";
import { useLocalStorage } from "../shared/useLocalStorage";
import { useMedia } from "../shared/useMedia";
import { useConvertComponentQuery, usePrettierQuery } from "../workers";
import { CodeEditor } from "./CodeEditor";
import { ErrorOverlay } from "./ErrorOverlay";
import { useUpdatePen } from "./PenQueries";
import { Preview } from "./Preview";

export const Pen = ({ slug, defaultName, defaultInput, defaultTailwindConfig }) => {
  const [name, setName] = useState(defaultName);
  const debouncedName = useDebounce(name, 500);
  const [input, setInput] = useState(defaultInput);
  const debouncedInput = useDebounce(input, 500);
  const [tailwindConfig, setTailwindConfig] = useState(defaultTailwindConfig);
  const debouncedTailwindConfig = useDebounce(tailwindConfig, 500);
  const [preset, setPreset] = useLocalStorage(
    "preset",
    /** @type {import("../codemods/convertComponent").TailwindToReactPreset} */ ("clsx")
  );

  const { mutate: updatePen } = useUpdatePen();
  useEffect(() => {
    if (slug) {
      updatePen({
        slug,
        name: debouncedName,
        html: debouncedInput,
        tailwindConfig: debouncedTailwindConfig,
      });
    }
  }, [debouncedInput, debouncedName, debouncedTailwindConfig, slug, updatePen]);

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
      <Global styles={{ "#root": tw`h-screen flex flex-col overflow-hidden` }} />
      <Navbar
        tw="bg-white dark:(bg-gray-900)"
        start={
          <div tw="flex items-center space-x-3">
            <Link
              to="/"
              css={[
                tw`p-2 rounded-md transition focus:(outline-none ring-2 ring-offset-2)`,
                tw`bg-gray-100 text-gray-300 hover:bg-gray-200 focus:ring-primary-500 focus:ring-offset-white`,
                tw`dark:(bg-gray-800 text-gray-500 hover:bg-gray-700 focus:ring-gray-700 focus:ring-offset-gray-900)`,
              ]}
            >
              <span tw="sr-only">Go back to dashboard</span>
              <ChevronLeftOutlineIcon tw="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </Link>
            {defaultName && (
              <div tw="hidden sm:block">
                <label tw="sr-only" htmlFor="name">
                  Pen name
                </label>
                <input
                  id="name"
                  type="text"
                  css={[
                    tw`h-8 text-sm rounded-md transition border-none focus:(outline-none ring-2 ring-offset-2)`,
                    tw`bg-gray-100 focus:ring-primary-500 focus:ring-offset-white`,
                    tw`dark:(bg-gray-800 focus:ring-gray-700 focus:ring-offset-gray-900)`,
                  ]}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
          </div>
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
