import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
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
    <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="https://unpkg.com/react@17.0.1/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@17.0.1/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@headlessui/react@0.2.0/dist/headlessui.umd.production.min.js"></script>
    <script src="https://unpkg.com/clsx@1.1.1/dist/clsx.min.js"></script>
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
    <div className="relative w-full h-full">
      <iframe
        className="absolute inset-0 h-full w-full"
        ref={iframeRef}
        title="Preview"
        srcDoc={template}
      />
      <div
        className={clsx(
          "absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-900 pointer-events-none transition-opacity duration-300 ease-in-out",
          {
            "opacity-0": isReady && status !== "loading",
            "opacity-75": !isReady || status === "loading",
          }
        )}
      >
        <Spinner className="mt-10">Loading preview</Spinner>
      </div>
    </div>
  );
};

export default Preview;
