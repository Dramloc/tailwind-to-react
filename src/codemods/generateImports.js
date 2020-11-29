// @ts-check
/** @typedef {"esm" | "umd"} BundleType */
/** @typedef {{ type: BundleType, preset: import("./convertComponent").TailwindToReactPreset }} GenerateImportsOptions */
/** @typedef {{ umd: string, url: string }} Dependency */

const dependencies = {
  react: {
    umd: "window.React",
    url: "https://unpkg.com/react@17.0.1/umd/react.production.min.js",
  },
  "react-dom": {
    umd: "window.ReactDOM",
    url: "https://unpkg.com/react-dom@17.0.1/umd/react-dom.production.min.js",
  },
  "@headlessui/react": {
    umd: "window.headlessui",
    url: "https://unpkg.com/@headlessui/react@0.2.0/dist/headlessui.umd.production.min.js",
  },
  clsx: {
    umd: "window.clsx",
    url: "https://unpkg.com/clsx@1.1.1/dist/clsx.min.js",
  },
  "@emotion/react": {
    umd: "window.emotionReact",
    url: "https://unpkg.com/@emotion/react@11.1.1/dist/emotion-react.umd.min.js",
  },
};

/** @typedef {{ imported: string, local: string, isDefault: false }} NamedImportSpecifier */
/** @typedef {{ local: string, isDefault: true }} DefaultImportSpecifier */
/** @typedef {DefaultImportSpecifier | NamedImportSpecifier} ImportSpecifier */
/** @typedef {{ specifiers: ImportSpecifier[], source: string }} ImportDeclaration */

/** @type {(local: string) => DefaultImportSpecifier} */
const defaultImportSpecifier = (local) => ({ local, isDefault: true });
/** @type {(importSpecifier: ImportSpecifier) => importSpecifier is DefaultImportSpecifier} */
const isDefaultImportSpecifier = (importSpecifier) => importSpecifier.isDefault;

/** @type {(imported: string, local?: string) => NamedImportSpecifier} */
const namedImportSpecifier = (imported, local = imported) => ({
  local,
  imported,
  isDefault: false,
});
/** @type {(importSpecifier: ImportSpecifier) => importSpecifier is NamedImportSpecifier} */
const isNamedImportSpecifier = (importSpecifier) => !importSpecifier.isDefault;

/** @type {(importDeclaration: ImportDeclaration, type: BundleType) => string} */
const printImportDeclaration = (importDeclaration, type) => {
  const defaultImport = importDeclaration.specifiers.find(isDefaultImportSpecifier);
  const namedImports = importDeclaration.specifiers.filter(isNamedImportSpecifier);
  if (type === "esm") {
    if (importDeclaration.specifiers.length === 0) {
      return `import "${importDeclaration.source}";`;
    }

    const defaultImportString = defaultImport ? defaultImport.local : null;
    const namedImportsString =
      namedImports.length !== 0
        ? "{" +
          namedImports
            .map((specifier) => {
              if (specifier.local === specifier.imported) {
                return specifier.local;
              }
              return `${specifier.imported} as ${specifier.local}`;
            })
            .join(", ") +
          " }"
        : null;

    const imports = [defaultImportString, namedImportsString].filter(Boolean).join(", ");
    return `import ${imports} from "${importDeclaration.source}";`;
  }
  if (type === "umd") {
    if (importDeclaration.specifiers.length === 0) {
      return "";
    }
    const defaultImportString = defaultImport ? defaultImport.local : null;
    const namedImportsString =
      namedImports.length !== 0
        ? "{" +
          namedImports
            .map((specifier) => {
              if (specifier.local === specifier.imported) {
                return specifier.local;
              }
              return `${specifier.imported}: ${specifier.local}`;
            })
            .join(", ") +
          " }"
        : null;

    const umd = dependencies[importDeclaration.source]?.umd;

    if (!umd) {
      return "";
    }

    return [defaultImportString, namedImportsString]
      .filter(Boolean)
      .map((importString) => `const ${importString} = ${umd};`)
      .join("\n");
  }
};

/** @type {(code: string) => ImportDeclaration | null} */
const generateReactImportDeclaration = (code) => {
  const specifiers = ["useEffect", "useMemo", "useRef", "useState"]
    .map((hook) => (code.includes(hook) ? namedImportSpecifier(hook) : null))
    .filter(Boolean);
  return specifiers.length !== 0
    ? {
        source: "react",
        specifiers,
      }
    : null;
};

/** @type {(code: string, preset: import("./convertComponent").TailwindToReactPreset) => ImportDeclaration | null} */
const generateHeadlessUIImportDeclaration = (code, preset) => {
  const specifiers = [
    code.includes("<Transition")
      ? namedImportSpecifier(
          "Transition",
          preset === "twin.macro" ? "HeadlessUITransition" : "Transition"
        )
      : null,
  ].filter(Boolean);
  return specifiers.length !== 0
    ? {
        source: "@headlessui/react",
        specifiers,
      }
    : null;
};

/** @type {(code: string) => ImportDeclaration} */
const generateTwinMacroImportDeclaration = (code) => {
  return {
    source: "twin.macro",
    specifiers: [code.includes("tw`") ? defaultImportSpecifier("tw") : null].filter(Boolean),
  };
};

const generateTwinMacroRuntime = (code) => {
  let runtime = "";
  if (code.includes("<Transition") || code.includes("<Transition.Child")) {
    runtime += `
const Transition = ({ enter, enterFrom, enterTo, leave, leaveFrom, leaveTo, ...props }) => {
  return (
    <ClassNames>
      {({ css }) => (
        <HeadlessUITransition
          enter={enter && css(enter)}
          enterFrom={enterFrom && css(enterFrom)}
          enterTo={enterTo && css(enterTo)}
          leave={leave && css(leave)}
          leaveFrom={leaveFrom && css(leaveFrom)}
          leaveTo={leaveTo && css(leaveTo)}
          {...props}
        />
      )}
    </ClassNames>
  );
};`;
  }
  if (code.includes("<Transition.Child")) {
    runtime += `
Transition.Child = ({
  enter,
  enterFrom,
  enterTo,
  leave,
  leaveFrom,
  leaveTo,
  ...props
}) => {
  return (
    <ClassNames>
      {({ css }) => (
        <HeadlessUITransition.Child
          enter={enter && css(enter)}
          enterFrom={enterFrom && css(enterFrom)}
          enterTo={enterTo && css(enterTo)}
          leave={leave && css(leave)}
          leaveFrom={leaveFrom && css(leaveFrom)}
          leaveTo={leaveTo && css(leaveTo)}
          {...props}
        />
      )}
    </ClassNames>
  );
};`;
  }
  return runtime;
};

const generateEmotionImportDeclaration = (code, type) => {
  const specifiers = [
    type === "umd" ? namedImportSpecifier("jsx") : null,
    code.includes("<Transition") ? namedImportSpecifier("ClassNames") : null,
  ].filter(Boolean);
  return specifiers.length !== 0
    ? {
        source: "@emotion/react",
        specifiers,
      }
    : null;
};

/** @type {(code: string) => ImportDeclaration | null} */
const generateClsxImportDeclaration = (code) => {
  const specifiers = [code.includes("clsx") ? defaultImportSpecifier("clsx") : null].filter(
    Boolean
  );
  return specifiers.length !== 0
    ? {
        source: "clsx",
        specifiers,
      }
    : null;
};

/** @type {(type: BundleType, preset: import("./convertComponent").TailwindToReactPreset) => string} */
const getJSXAnnotation = (type, preset) => {
  if (preset === "clsx") {
    return "";
  }
  if (type === "esm") {
    return "/** @jsxImportSource @emotion/react */";
  }
  return "/** @jsx jsx */";
};

/** @type {(code: string, options?: Partial<GenerateImportsOptions>) => string} */
export const generateImports = (code, { type = "esm", preset = "clsx" } = {}) => {
  const jsxAnnotation = getJSXAnnotation(type, preset);
  const importDeclarations = [
    generateReactImportDeclaration(code),
    generateHeadlessUIImportDeclaration(code, preset),
    preset === "clsx" && generateClsxImportDeclaration(code),
    preset === "twin.macro" && generateTwinMacroImportDeclaration(code),
    preset === "twin.macro" && generateEmotionImportDeclaration(code, type),
  ]
    .filter(Boolean)
    .map((importDeclaration) => {
      if (importDeclaration.source === "twin.macro") {
        // Always generate esm imports for twin so the macro can be evaluated
        return printImportDeclaration(importDeclaration, "esm");
      }
      return printImportDeclaration(importDeclaration, type);
    })
    .join("\n");

  const runtime = [preset === "twin.macro" && generateTwinMacroRuntime(code)]
    .filter(Boolean)
    .join("\n");

  return `${jsxAnnotation}\n${importDeclarations}\n\n${runtime}`;
};
