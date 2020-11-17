import { transformAsync } from "@babel/core";
import buildAllSyntaxPlugin from "@codemod/core/src/AllSyntaxPlugin";
import RecastPlugin from "@codemod/core/src/RecastPlugin";
import HTMLtoJSX from "htmltojsx";
import { className } from "./className";
import { reorderJSXAttributes } from "./reorderJSXAttributes";
import { tailwindAlt } from "./tailwindAlt";
import { tailwindAriaHasPopup } from "./tailwindAriaHasPopup";
import { tailwindHref } from "./tailwindHref";
import { tailwindRadioGroup } from "./tailwindRadioGroup";
import { tailwindSelectMenuButton } from "./tailwindSelectMenuButton";
import { tailwindSelectMenuListbox } from "./tailwindSelectMenuListbox";
import { tailwindStep } from "./tailwindStep";
import { tailwindUlAriaDisabled } from "./tailwindUlAriaDisabled";
import { xCloak } from "./xCloak";
import { xData } from "./xData";
import { xDescription } from "./xDescription";
import { xInit } from "./xInit";
import { xMax } from "./xMax";
import { xState } from "./xState";

/** @type {(component: { name: string, html: string }) => Promise<babel.BabelFileResult>} */
export const convertComponent = ({ name, html }) => {
  const jsx = new HTMLtoJSX({
    createClass: false,
  })
    .convert(html)
    // Alpine replacements
    .replace(/ :([^(="\s)]*)="/g, (_, attribute) => {
      return ` x-bind:${attribute}="`;
    })
    .replace(/ @([^(="\s)]*)="/g, (_, event) => {
      return ` x-on:${event.replace(/\./g, "$")}="`;
    });

  const componentDeclaration = `const ${name} = () => {
return (
    <>
      ${jsx}
    </>
  );
};`;

  return transformAsync(componentDeclaration, {
    plugins: [
      tailwindRadioGroup,
      tailwindSelectMenuButton,
      tailwindSelectMenuListbox,
      tailwindStep,
      tailwindAlt,
      tailwindHref,
      tailwindUlAriaDisabled,
      tailwindAriaHasPopup,
      reorderJSXAttributes,
      xData,
      xState,
      xDescription,
      xMax,
      xCloak,
      xInit,
      className,
      buildAllSyntaxPlugin("unambiguous"),
      RecastPlugin,
    ],
  });
};
