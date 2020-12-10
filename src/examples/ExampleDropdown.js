/** @jsxImportSource @emotion/react */
import { Menu } from "@headlessui/react";
import tw from "twin.macro";
import { Transition } from "../shared/Transition";

/** @typedef {{ name: string, load: () => Promise<{ default: string }> }} Example */
/** @type {Example[]} */
const examples = [
  {
    name: "Welcome",
    load: () => import("raw-loader!./welcome.html"),
  },
  {
    name: "Hero",
    load: () => import("raw-loader!./hero.html"),
  },
  {
    name: "Header",
    load: () => import("raw-loader!./header.html"),
  },
  {
    name: "Stacked Layout",
    load: () => import("raw-loader!./stacked-layout.html"),
  },
  {
    name: "Slide-Over",
    load: () => import("raw-loader!./slide-over.html"),
  },
  {
    name: "@tailwindcss/forms",
    load: () => import("raw-loader!./forms.html"),
  },
  {
    name: "@tailwindcss/typography",
    load: () => import("raw-loader!./typography.html"),
  },
];

/** @type {React.FC<{ onChange: (example: Example) => void }>} */
export const ExampleDropdown = ({ onChange }) => {
  return (
    <div tw="relative inline-block text-left">
      <Menu>
        {({ open }) => (
          <>
            <Menu.Button
              css={[
                tw`inline-flex justify-center rounded-md shadow-sm px-4 py-2 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150`,
                tw`light:(bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500 focus:ring-offset-white)`,
                tw`dark:(bg-gray-800 border-gray-800 text-white hover:bg-gray-700 focus:ring-gray-700 focus:ring-offset-gray-900)`,
              ]}
            >
              <span>Examples</span>
              <svg tw="w-5 h-5 ml-2 -mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Menu.Button>

            {/* FIXME: scale-* variables are not applied by twin.macro correctly, cleanup when https://github.com/ben-rogerson/twin.macro/issues/215 is fixed */}
            <Transition
              show={open}
              enter={tw`transition ease-out duration-100`}
              enterFrom={[
                tw`transform opacity-0 scale-95`,
                { "--tw-scale-x": 0.95, "--tw-scale-y": 0.95 },
              ]}
              enterTo={[
                tw`transform opacity-100 scale-100`,
                { "--tw-scale-x": 1, "--tw-scale-y": 1 },
              ]}
              leave={tw`transition ease-in duration-75`}
              leaveFrom={[
                tw`transform opacity-100 scale-100`,
                { "--tw-scale-x": 1, "--tw-scale-y": 1 },
              ]}
              leaveTo={[
                tw`transform opacity-0 scale-95`,
                { "--tw-scale-x": 0.95, "--tw-scale-y": 0.95 },
              ]}
            >
              <Menu.Items
                static
                css={[
                  tw`absolute left-0 w-56 mt-2 origin-top-left border rounded-md shadow-lg outline-none`,
                  tw`light:(bg-white border-gray-200)`,
                  tw`dark:(bg-gray-800 border-gray-800)`,
                ]}
              >
                <div tw="py-1">
                  {examples.map((example, index) => (
                    <Menu.Item key={index}>
                      {({ active }) => (
                        <button
                          onClick={() => onChange(example)}
                          tw="flex justify-between w-full px-4 py-2 text-sm leading-5 text-left"
                          css={
                            active
                              ? tw`bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white`
                              : tw`text-gray-700 dark:text-gray-200`
                          }
                        >
                          {example.name}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </div>
  );
};
