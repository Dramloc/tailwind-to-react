import { Menu, Transition } from "@headlessui/react";
import clsx from "clsx";

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
];

/** @type {React.FC<{ onChange: (example: Example) => void }>} */
export const ExampleDropdown = ({ onChange }) => {
  return (
    <div className="relative inline-block text-left">
      <Menu>
        {({ open }) => (
          <>
            <Menu.Button className="inline-flex justify-center rounded-md shadow-sm px-4 py-2 border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-gray-700 focus:ring-offset-white dark:focus:ring-offset-gray-900">
              <span>Examples</span>
              <svg className="w-5 h-5 ml-2 -mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Menu.Button>

            <Transition
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                static
                className="absolute left-0 w-56 mt-2 origin-top-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 rounded-md shadow-lg outline-none"
              >
                <div className="py-1">
                  {examples.map((example, index) => (
                    <Menu.Item key={index}>
                      {({ active }) => (
                        <button
                          onClick={() => onChange(example)}
                          className={clsx(
                            "flex justify-between w-full px-4 py-2 text-sm leading-5 text-left",
                            {
                              "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white": active,
                              "text-gray-700 dark:text-gray-200": !active,
                            }
                          )}
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
