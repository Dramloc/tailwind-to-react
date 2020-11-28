import { StrictMode } from "react";
import { render } from "react-dom";
import { QueryCache, ReactQueryCacheProvider } from "react-query";
import App from "./App";
import "./index.css";
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
    <ReactQueryCacheProvider queryCache={queryCache}>
      <ColorModeProvider>
        <App />
      </ColorModeProvider>
    </ReactQueryCacheProvider>
  </StrictMode>,
  document.getElementById("root")
);
