import { Global } from "@emotion/react";
import { StrictMode } from "react";
import { render } from "react-dom";
import { QueryCache, ReactQueryCacheProvider } from "react-query";
import tw, { GlobalStyles } from "twin.macro";
import App from "./App";
import { ColorModeProvider } from "./shared/ColorModeProvider";

const queryCache = new QueryCache({
  defaultConfig: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

render(
  <StrictMode>
    <GlobalStyles />
    <Global
      styles={{
        body: tw`antialiased font-sans`,
        "#root": tw`h-screen flex flex-col overflow-hidden bg-white text-gray-800 dark:bg-gray-900 dark:text-white`,
      }}
    />
    <ReactQueryCacheProvider queryCache={queryCache}>
      <ColorModeProvider>
        <App />
      </ColorModeProvider>
    </ReactQueryCacheProvider>
  </StrictMode>,
  document.getElementById("root")
);
