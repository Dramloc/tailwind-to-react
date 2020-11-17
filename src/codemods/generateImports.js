const getTransitionSource = (code) => {
  if (!code.includes("<Transition")) {
    return "";
  }

  return `
    const Transition = ({
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
    };

    ${
      code.includes("<Transition.Child")
        ? `Transition.Child = ({
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
    };
    `
        : ""
    }`;
};

export const generateImports = (code, { runtime = "automatic" } = {}) => {
  const reactImports = runtime === "automatic" ? [] : ["Fragment"];
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
  const reactImport =
    reactImports.length === 0 ? "" : `import { ${reactImports.join(", ")} } from "react";`;

  const emotionImports = runtime === "automatic" ? [] : ["jsx"];
  if (code.includes("<Transition")) {
    emotionImports.push("ClassNames");
  }
  const emotionImport =
    emotionImports.length === 0
      ? ""
      : `import { ${emotionImports.join(", ")} } from "@emotion/react";`;

  const headlessUiImport = code.includes("<Transition")
    ? 'import { Transition as HeadlessUITransition } from "@headlessui/react";'
    : "";

  const twinImport = code.includes("tw`") ? 'import tw from "twin.macro";' : 'import "twin.macro";';

  const transitionSource = getTransitionSource(code);

  return `${runtime === "automatic" ? "/** @jsxImportSource @emotion/react */" : "/** @jsx jsx */"}
  ${emotionImport}${headlessUiImport}${reactImport}${twinImport}

  ${transitionSource}`;
};
