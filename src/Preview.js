/** @jsxImportSource @emotion/react */
import { useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import tw from "twin.macro";
import { ErrorOverlay } from "./shared/ErrorOverlay";
import { Spinner } from "./shared/Spinner";
import { babelWorker } from "./workers";

/** @type {(input: string, preset: import("./codemods/convertComponent").TailwindToReactPreset) => import("react-query").QueryResult<string>} */
const useGeneratePreviewQuery = (input, preset) => {
  return useQuery(
    ["preview", input, preset],
    async () => babelWorker.generatePreview(input, preset),
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
    <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
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
          $script.innerHTML = data.payload;
          document.body.appendChild($script);
        }
      });
      window.postMessage({ type: "PREVIEW_READY" }, "*");
    </script>
  </body>
</html>`;

/** @type {React.FC<{ code: string, preset: import("./codemods/convertComponent").TailwindToReactPreset, isInputLoading: boolean }>} */
export const Preview = ({ code, preset, isInputLoading }) => {
  const iframeRef = useRef(/** @type {HTMLIFrameElement} */ (undefined));
  const [isReady, setIsReady] = useState(false);
  const { status, data: previewCode, error } = useGeneratePreviewQuery(code, preset);
  const [runtimeError, setRuntimeError] = useState(null);
  const isLoading = isInputLoading || status === "idle" || status === "loading" || !isReady;

  useEffect(() => {
    const $iframe = iframeRef.current;
    if (!$iframe) {
      return;
    }
    const $iframeContentWindow = $iframe.contentWindow;
    if (!$iframeContentWindow) {
      return;
    }
    if (!isLoading) {
      setRuntimeError(null);
      $iframeContentWindow.postMessage(
        {
          type: "PREVIEW_CHANGED",
          payload: previewCode,
        },
        "*"
      );
    }

    const listener = ({ data }) => {
      if (data.type === "PREVIEW_READY") {
        setIsReady(true);
      }
      if (data.type === "PREVIEW_ERROR") {
        setRuntimeError(data.payload);
      }
    };
    $iframeContentWindow.addEventListener("message", listener);
    return () => {
      $iframeContentWindow.removeEventListener("message", listener);
    };
  }, [isLoading, previewCode]);

  return (
    <>
      <iframe
        tw="absolute inset-0 h-full w-full"
        ref={iframeRef}
        title="Preview"
        srcDoc={template}
      />
      <div
        tw="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-900 pointer-events-none transition-opacity duration-300 ease-in-out"
        css={isLoading ? tw`opacity-75` : tw`opacity-0`}
      >
        <Spinner tw="mt-10">Loading preview</Spinner>
      </div>
      <ErrorOverlay origin="Preview" error={error} />
      <ErrorOverlay origin="Runtime" error={runtimeError} />
    </>
  );
};
