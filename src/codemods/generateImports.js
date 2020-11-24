/** @type {(code: string, options?: { type?: ("esm" | "umd") }) => string} */
export const generateImports = (code, { type = "esm" } = {}) => {
  const reactImports = [];
  if (code.includes("useEffect")) {
    reactImports.push("useEffect");
  }
  if (code.includes("useMemo")) {
    reactImports.push("useMemo");
  }
  if (code.includes("useRef")) {
    reactImports.push("useRef");
  }
  if (code.includes("useState")) {
    reactImports.push("useState");
  }

  const headlessUiImports = [];
  if (code.includes("<Transition")) {
    headlessUiImports.push("Transition");
  }

  switch (type) {
    case "umd": {
      const reactImport =
        reactImports.length === 0 ? "" : `const { ${reactImports.join(", ")} } = React;`;

      const headlessUiImport =
        headlessUiImports.length === 0
          ? ""
          : `const { ${headlessUiImports.join(", ")} } = headlessui;`;
      return `${headlessUiImport}${reactImport}`;
    }
    case "esm":
    default: {
      const reactImport =
        reactImports.length === 0 ? "" : `import { ${reactImports.join(", ")} } from "react";`;

      const clsxImport = code.includes("clsx") ? 'import clsx from "clsx";' : "";

      const headlessUiImport =
        headlessUiImports.length === 0
          ? ""
          : `import { ${headlessUiImports.join(", ")} } from "@headlessui/react";`;
      return `${clsxImport}${headlessUiImport}${reactImport}`;
    }
  }
};
