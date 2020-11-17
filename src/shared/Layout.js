/** @jsxImportSource @emotion/react */
import { Switch } from "@headlessui/react";
import "twin.macro";
import tw from "twin.macro";
import { useColorMode } from "./ColorModeProvider";

const Navbar = ({ start, center, end }) => {
  return (
    <header tw="relative z-10 flex-none py-3 px-5 sm:px-6 flex items-center space-x-4 bg-white dark:bg-monaco-gray-900">
      <div tw="flex-auto flex items-center min-w-0 space-x-5">{start}</div>
      <div tw="flex items-center space-x-5">{end}</div>
    </header>
  );
};

const ColorModeSwitch = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isEnabled = colorMode === "light";
  return (
    <Switch
      checked={isEnabled}
      onChange={toggleColorMode}
      tw="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-solid text-gray-300 dark:text-gray-500"
      css={
        isEnabled
          ? tw`bg-indigo-600 dark:bg-indigo-500`
          : tw`bg-monaco-gray-200 dark:bg-monaco-gray-800`
      }
    >
      <span tw="sr-only">Toggle color mode</span>
      <span
        tw="relative inline-block h-5 w-5 rounded-full bg-white dark:bg-monaco-gray-900 shadow transition ease-in-out duration-200"
        css={isEnabled ? tw`transform translate-x-5` : tw`transform translate-x-0`}
      >
        <span
          tw="absolute inset-0 h-full w-full flex items-center justify-center transition-opacity"
          css={
            isEnabled ? tw`opacity-0 ease-in duration-200` : tw`opacity-100 ease-out duration-100`
          }
        >
          <svg tw="h-4 w-4 text-monaco-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </span>
        <span
          tw="absolute inset-0 h-full w-full flex items-center justify-center transition-opacity"
          css={
            isEnabled ? tw`opacity-100 ease-out duration-100` : tw`opacity-0 ease-in duration-200`
          }
        >
          <svg
            tw="h-4 w-4 text-indigo-600 dark:text-indigo-500"
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

export const Layout = ({ children }) => {
  return (
    <div tw="h-screen flex overflow-hidden bg-monaco-gray-100 text-monaco-gray-800 dark:bg-monaco-gray-900 dark:text-white">
      <div tw="flex flex-col w-0 flex-1 overflow-hidden">
        <Navbar end={<ColorModeSwitch />} />
        {children}
      </div>
    </div>
  );
};
