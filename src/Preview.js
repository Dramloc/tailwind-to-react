/** @jsxImportSource @emotion/react */
import { useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import "twin.macro";
import tw from "twin.macro";
// eslint-disable-next-line import/no-webpack-loader-syntax
import PreviewWorker from "workerize-loader!./PreviewWorker";
import { Spinner } from "./shared/Spinner";

const previewWorker = PreviewWorker();

const useGeneratePreviewQuery = (input) => {
  return useQuery(
    ["babel", input],
    async () => {
      return previewWorker.transform(input);
    },
    {
      enabled: input,
    }
  );
};

const template = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/tailwindcss@1.9.6/dist/base.min.css" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.process = {
        env: {
          NODE_ENV: "production"
        }
      }
    </script>
    <script>
      // https://github.com/sveltejs/svelte-repl/blob/master/src/Output/srcdoc/index.html
      // https://github.com/sveltejs/svelte-repl/blob/master/LICENSE
      document.body.addEventListener('click', event => {
        if (event.which !== 1) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        if (event.defaultPrevented) return;

        // ensure target is a link
        let el = event.target;
        while (el && el.nodeName !== 'A') el = el.parentNode;
        if (!el || el.nodeName !== 'A') return;

        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external' || el.target) return;

        event.preventDefault();
        window.open(el.href, '_blank');
      });
      document.body.addEventListener('submit', event => {
        event.preventDefault();
      });
    </script>
    <script type="importmap">
    {
      "imports": {
        "react": "https://unpkg.com/es-react@16.13.1/react.js",
        "react-dom": "https://unpkg.com/es-react@16.13.1/react-dom.js",
        "react-is": "https://unpkg.com/es-react@16.13.1/react-is.js",
        "@emotion/react": "https://unpkg.com/@emotion/react@11.1.1/dist/emotion-react.browser.esm.js",
        "@emotion/cache": "https://unpkg.com/@emotion/cache@11.0.0/dist/emotion-cache.esm.js",
        "@emotion/memoize": "https://unpkg.com/@emotion/memoize@0.7.4/dist/memoize.esm.js",
        "@emotion/weak-memoize": "https://unpkg.com/@emotion/weak-memoize@0.2.5/dist/weak-memoize.esm.js",
        "@emotion/utils": "https://unpkg.com/@emotion/utils@1.0.0/dist/emotion-utils.esm.js",
        "@emotion/serialize": "https://unpkg.com/@emotion/serialize@1.0.0/dist/emotion-serialize.esm.js",
        "@emotion/sheet": "https://unpkg.com/@emotion/sheet@1.0.0/dist/emotion-sheet.esm.js",
        "@emotion/hash": "https://unpkg.com/@emotion/hash@0.8.0/dist/hash.esm.js",
        "@emotion/unitless": "https://unpkg.com/@emotion/unitless@0.7.5/dist/unitless.esm.js",
        "@babel/runtime/helpers/": "https://unpkg.com/@babel/runtime@7.12.5/helpers/esm/",
        "@babel/runtime/helpers/esm/": "https://unpkg.com/@babel/runtime@7.12.5/helpers/esm/",
        "stylis": "https://unpkg.com/stylis@4.0.3/dist/stylis.mjs",
        "@headlessui/react": "https://unpkg.com/@headlessui/react@0.2.0/dist/headlessui.esm.js",
        "hoist-non-react-statics": "/hoist-non-react-statics.js"
      }
    }
    </script>
    <script type="module">
      window.addEventListener("message", ({ data }) => {
        if (data.type === "PREVIEW_CHANGED") {
          let $script = document.getElementById("preview");
          if ($script) {
            $script.remove();
          }
          $script = document.createElement("script");
          $script.type = "module";
          $script.id = "preview";
          $script.innerText = data.payload;
          document.body.appendChild($script);
        }
      });
      window.postMessage({ type: "PREVIEW_READY" });
    </script>
  </body>
</html>`;

const Preview = ({ code }) => {
  const iframeRef = useRef();
  const [isReady, setIsReady] = useState(false);
  const { status, data: previewCode } = useGeneratePreviewQuery(code);

  useEffect(() => {
    const $iframe = iframeRef.current;
    if (!$iframe || !$iframe.contentWindow) {
      return;
    }
    const $iframeContentWindow = $iframe.contentWindow;
    if (isReady && status === "success") {
      $iframeContentWindow.postMessage({
        type: "PREVIEW_CHANGED",
        payload: previewCode,
      });
    }
    const listener = ({ data }) => {
      if (data.type === "PREVIEW_READY") {
        setIsReady(true);
        if (status === "success") {
          $iframeContentWindow.postMessage({
            type: "PREVIEW_CHANGED",
            payload: previewCode,
          });
        }
      }
    };
    $iframeContentWindow.addEventListener("message", listener);
    return () => {
      $iframeContentWindow.removeEventListener("message", listener);
    };
  }, [isReady, previewCode, status]);

  return (
    <div tw="relative w-full h-full">
      <iframe
        tw="absolute inset-0 h-full w-full"
        ref={iframeRef}
        title="Preview"
        srcDoc={template}
      />
      <div
        tw="absolute inset-0 flex items-center justify-center bg-monaco-gray-200 dark:bg-monaco-gray-900 pointer-events-none transition-opacity duration-300 ease-in-out"
        css={isReady && status !== "loading" ? tw`opacity-0` : tw`opacity-75`}
      >
        <Spinner tw="mt-10">Loading preview</Spinner>
      </div>
    </div>
  );
};

export default Preview;
