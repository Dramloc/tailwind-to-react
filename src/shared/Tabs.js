/** @jsxImportSource @emotion/react */
import {
  Tab as ReachTab,
  TabList as ReachTabList,
  TabPanel as ReachTabPanel,
  TabPanels as ReachTabPanels,
  Tabs as ReachTabs,
} from "@reach/tabs";
import "@reach/tabs/styles.css";
import tw from "twin.macro";

/** @type {typeof ReachTabs} */
export const Tabs = (props) => {
  return (
    <ReachTabs
      tw="flex flex-col bg-white dark:bg-gray-900 md:border-r border-gray-200 dark:border-gray-800"
      {...props}
    />
  );
};

/** @type {typeof ReachTabList} */
export const TabList = (props) => {
  return (
    <ReachTabList
      tw="flex items-center bg-transparent space-x-5 -mt-px flex-none px-5 sm:px-6"
      {...props}
    />
  );
};

/** @type {typeof ReachTab} */
export const Tab = ({ isSelected, children, ...props }) => {
  return (
    <ReachTab
      tw="flex text-xs leading-4 font-medium px-0.5 py-0 border-0 border-t-2 border-solid focus:outline-none transition-colors duration-150"
      css={
        isSelected
          ? tw`border-primary-500 text-gray-900 dark:text-white`
          : tw`border-transparent text-gray-500 hover:text-gray-900 focus:text-gray-900 dark:text-gray-400 dark:hover:text-white dark:focus:text-white`
      }
      {...props}
    >
      <span tw="py-2.5 border-b-2 border-transparent">{children}</span>
    </ReachTab>
  );
};

/** @type {typeof ReachTabPanels} */
export const TabPanels = (props) => {
  return <ReachTabPanels tw="flex-1 border-t border-gray-200 dark:border-gray-800" {...props} />;
};

/** @type {typeof ReachTabPanel} */
export const TabPanel = (props) => {
  return <ReachTabPanel tw="w-full h-full focus:outline-none" {...props} />;
};
