import { Global } from "@emotion/react";
import { QueryCache, ReactQueryCacheProvider } from "react-query";
import tw, { GlobalStyles } from "twin.macro";
import Pen from "./pen/Pen";
import { ColorModeProvider } from "./shared/ColorModeProvider";

const queryCache = new QueryCache({
  defaultConfig: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <GlobalStyles />
      <Global
        styles={{
          body: tw`antialiased font-sans`,
          "#root": tw`h-screen flex flex-col overflow-hidden bg-white text-gray-800 dark:bg-gray-900 dark:text-white`,
        }}
      />
      <ColorModeProvider>
        <Pen />
      </ColorModeProvider>
    </ReactQueryCacheProvider>
  );
};

export default App;
