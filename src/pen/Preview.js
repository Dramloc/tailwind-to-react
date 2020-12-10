/** @jsxImportSource @emotion/react */
import { useEffect, useRef, useState } from "react";
import tw from "twin.macro";
import { Spinner } from "../shared/Spinner";
import { useCompileCSSQuery, useCompileJSQuery } from "../workers";
import { ErrorOverlay } from "./ErrorOverlay";

const template = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://cdn.skypack.dev/tailwindcss/dist/base.min.css" rel="stylesheet" />
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
    <style id="preview-css">
      body { display: none; }
    </style>
    <script type="module">
      window.addEventListener("message", ({ data }) => {
        if (data.type === "PREVIEW_JS_CHANGED") {
          let $script = document.getElementById("preview-js");
          if ($script) {
            $script.remove();
          }
          $script = document.createElement("script");
          $script.type = "module";
          $script.id = "preview-js";
          $script.innerHTML = data.payload;
          document.body.appendChild($script);
        }
        if (data.type === "PREVIEW_CSS_CHANGED") {
          let $style = document.getElementById("preview-css");
          if ($style) {
            $style.remove();
          }
          $style = document.createElement("style");
          $style.id = "preview-css";
          $style.innerHTML = data.payload || "body { display: none; }";
          document.body.appendChild($style);
        }
      });
      window.postMessage({ type: "PREVIEW_READY" }, "*");
    </script>
  </body>
</html>`;

/** @type {React.FC<{ code: string, tailwindConfig: string, preset: import("../codemods/convertComponent").TailwindToReactPreset, isConverting: boolean }>} */
export const Preview = ({ code, tailwindConfig, preset, isConverting }) => {
  const iframeRef = useRef(/** @type {HTMLIFrameElement} */ (undefined));

  const jsResult = useCompileJSQuery({ code, tailwindConfig, preset });
  const cssResult = useCompileCSSQuery({ tailwindConfig, preset });

  const [isReady, setIsReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState(null);
  const sendAction = (action) => {
    const $iframe = iframeRef.current?.contentWindow;
    if (!$iframe) return;
    $iframe.postMessage(action, "*");
  };
  useEffect(() => {
    const $iframe = iframeRef.current?.contentWindow;
    if (!$iframe) return;
    const listener = ({ data }) => {
      if (data.type === "PREVIEW_READY") {
        setIsReady(true);
      }
      if (data.type === "PREVIEW_ERROR") {
        setRuntimeError(data.payload);
      }
    };
    $iframe.addEventListener("message", listener);
    return () => $iframe.removeEventListener("message", listener);
  }, []);

  useEffect(() => {
    setRuntimeError(null);
    sendAction({ type: "PREVIEW_JS_CHANGED", payload: jsResult.data });
  }, [jsResult.data, isReady]);

  useEffect(() => {
    sendAction({ type: "PREVIEW_CSS_CHANGED", payload: cssResult.data });
  }, [cssResult.data, isReady]);

  const isLoading =
    isConverting ||
    !isReady ||
    jsResult.status === "idle" ||
    jsResult.status === "loading" ||
    cssResult.status === "idle" ||
    cssResult.status === "loading";

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
      <ErrorOverlay origin="Preview JS" error={jsResult.error} />
      <ErrorOverlay origin="Preview CSS" error={cssResult.error} />
      <ErrorOverlay origin="Runtime" error={runtimeError} />
    </>
  );
};
