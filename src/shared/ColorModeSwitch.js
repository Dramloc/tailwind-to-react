import { Switch } from "@headlessui/react";
import clsx from "clsx";
import { useColorMode } from "./ColorModeProvider";

export const ColorModeSwitch = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isEnabled = colorMode === "light";
  return (
    <Switch
      checked={isEnabled}
      onChange={toggleColorMode}
      className={clsx(
        "relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-gray-700 focus:ring-offset-white dark:focus:ring-offset-gray-900 text-gray-300 dark:text-gray-500",
        {
          "bg-primary-600 dark:bg-primary-500": isEnabled,
          "bg-gray-200 dark:bg-gray-800": !isEnabled,
        }
      )}
    >
      <span className="sr-only">Toggle color mode</span>
      <span
        className={clsx(
          "relative inline-block h-5 w-5 rounded-full bg-white dark:bg-gray-900 shadow transition ease-in-out duration-200 transform",
          {
            "translate-x-5": isEnabled,
            "translate-x-0": !isEnabled,
          }
        )}
      >
        <span
          className={clsx(
            "absolute inset-0 h-full w-full flex items-center justify-center transition-opacity",
            {
              "opacity-0 ease-in duration-200": isEnabled,
              "opacity-100 ease-out duration-100": !isEnabled,
            }
          )}
        >
          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </span>
        <span
          className={clsx(
            "absolute inset-0 h-full w-full flex items-center justify-center transition-opacity",
            {
              "opacity-100 ease-out duration-100": isEnabled,
              "opacity-0 ease-in duration-200": !isEnabled,
            }
          )}
        >
          <svg
            className="h-4 w-4 text-primary-600 dark:text-primary-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </span>
    </Switch>
  );
};
