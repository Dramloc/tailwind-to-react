import { StrictMode } from "react";
import { render } from "react-dom";
import { QueryCache, ReactQueryCacheProvider } from "react-query";
import App from "./App";
import "./index.css";

const queryCache = new QueryCache({
  defaultConfig: {
    queries: {
      retry: false,
    },
  },
});

render(
  <StrictMode>
    <ReactQueryCacheProvider queryCache={queryCache}>
      <App />
    </ReactQueryCacheProvider>
  </StrictMode>,
  document.getElementById("root")
);
