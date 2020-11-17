/* eslint-disable no-use-before-define, no-sequences */

import babylon from "@babel/parser";
import chalk from "chalk";
import cleanSet from "clean-set";
import createColor from "color";
import dlv from "dlv";
import deepMerge from "lodash.merge";
import stringSimilarity from "string-similarity";
import processPlugins from "tailwindcss/lib/util/processPlugins";
import resolveTailwindConfig from "tailwindcss/lib/util/resolveConfig";
import defaultTailwindConfig from "tailwindcss/stubs/defaultConfig.stub";
import { sort as timSort } from "timsort";
import { createMacro, MacroError } from "./babelPluginMacros";

var throwIf = function (expression, callBack) {
  if (!expression) {
    return;
  }
  throw new MacroError(callBack());
};

var isEmpty = function (value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0)
  );
};

var addPxTo0 = function (string) {
  return Number(string) === 0 ? string + "px" : string;
};

var getTheme = function (configTheme) {
  return function (grab, sub, theme) {
    if (theme === void 0) theme = configTheme;

    return grab ? dlv(theme, sub ? [grab, sub] : grab) : theme;
  };
};

var stripNegative = function (string) {
  return string && string.length > 1 && string.slice(0, 1) === "-"
    ? string.slice(1, string.length)
    : string;
};

var configGooberDefaults = {
  sassyPseudo: true,
};

var configTwinDefaults = function (state) {
  return Object.assign(
    {},
    {
      allowStyleProp: false,
      // Allows styles within style="blah" without throwing an error
      autoCssProp: false,
      // Automates the import of styled-components so you can use their css prop
      disableColorVariables: false,
      // Disable css variables in colors (except gradients) to support older browsers/react native
      hasSuggestions: true,
      // Switch suggestions on/off when you use a tailwind class that's not found
      sassyPseudo: false,
    },
    // Sets selectors like hover to &:hover
    // ...
    // TODO: Add the rest of the twin config items here (ongoing migration)
    state.isGoober && configGooberDefaults
  );
};

var isBoolean = function (value) {
  return typeof value === "boolean";
};

var configTwinValidators = {
  allowStyleProp: [isBoolean, "The config “allowStyleProp” can only be true or false"],
  autoCssProp: [isBoolean, "The config “autoCssProp” can only be true or false"],
  disableColorVariables: [
    isBoolean,
    "The config “disableColorVariables” can only be true or false",
  ],
  hasSuggestions: [isBoolean, "The config “hasSuggestions” can only be true or false"],
  sassyPseudo: [isBoolean, "The config “sassyPseudo” can only be true or false"],
};

var dynamicStyles = {
  /**
   * ===========================================
   * Layout
   */
  // https://tailwindcss.com/docs/animation
  animate: {
    plugin: "animation",
  },
  // https://tailwindcss.com/docs/container
  container: {
    plugin: "container",
  },
  // https://tailwindcss.com/docs/box-sizing
  // https://tailwindcss.com/docs/display
  // https://tailwindcss.com/docs/float
  // https://tailwindcss.com/docs/clear
  // https://tailwindcss.com/docs/object-fit
  // See staticStyles.js
  // https://tailwindcss.com/docs/object-position
  object: {
    prop: "objectPosition",
    config: "objectPosition",
  },
  // https://tailwindcss.com/docs/overflow
  // https://tailwindcss.com/docs/position
  // See staticStyles.js
  // https://tailwindcss.com/docs/top-right-bottom-left
  top: {
    prop: "top",
    config: "inset",
  },
  bottom: {
    prop: "bottom",
    config: "inset",
  },
  right: {
    prop: "right",
    config: "inset",
  },
  left: {
    prop: "left",
    config: "inset",
  },
  "inset-y": {
    prop: ["top", "bottom"],
    config: "inset",
  },
  "inset-x": {
    prop: ["left", "right"],
    config: "inset",
  },
  inset: {
    prop: ["top", "right", "bottom", "left"],
    config: "inset",
  },
  // https://tailwindcss.com/docs/visibility
  // See staticStyles.js
  // https://tailwindcss.com/docs/z-index
  z: {
    prop: "zIndex",
    config: "zIndex",
  },
  // https://tailwindcss.com/docs/space
  // space-x-reverse + space-y-reverse are in staticStyles
  "space-y": {
    plugin: "space",
  },
  "space-x": {
    plugin: "space",
  },
  // https://tailwindcss.com/docs/divide-width/
  "divide-opacity": {
    plugin: "divide",
  },
  "divide-y": {
    plugin: "divide",
  },
  "divide-x": {
    plugin: "divide",
  },
  divide: {
    plugin: "divide",
  },

  /**
   * ===========================================
   * Flexbox
   */
  // https://tailwindcss.com/docs/flex-direction
  // https://tailwindcss.com/docs/flex-wrap
  // https://tailwindcss.com/docs/align-items
  // https://tailwindcss.com/docs/align-content
  // https://tailwindcss.com/docs/align-self
  // https://tailwindcss.com/docs/justify-content
  // See staticStyles.js
  // https://tailwindcss.com/docs/flex-grow
  "flex-grow": {
    prop: "flexGrow",
    config: "flexGrow",
  },
  // https://tailwindcss.com/docs/flex-shrink
  "flex-shrink": {
    prop: "flexShrink",
    config: "flexShrink",
  },
  // https://tailwindcss.com/docs/flex
  flex: {
    prop: "flex",
    config: "flex",
  },
  // https://tailwindcss.com/docs/order
  order: {
    prop: "order",
    config: "order",
  },

  /**
   * ===========================================
   * Grid
   */
  // https://tailwindcss.com/docs/grid-template-columns
  "grid-cols": {
    prop: "gridTemplateColumns",
    config: "gridTemplateColumns",
  },
  // https://tailwindcss.com/docs/grid-column
  col: {
    prop: "gridColumn",
    config: "gridColumn",
  },
  "col-start": {
    prop: "gridColumnStart",
    config: "gridColumnStart",
  },
  "col-end": {
    prop: "gridColumnEnd",
    config: "gridColumnEnd",
  },
  // https://tailwindcss.com/docs/grid-template-rows
  "grid-rows": {
    prop: "gridTemplateRows",
    config: "gridTemplateRows",
  },
  // https://tailwindcss.com/docs/grid-row
  row: {
    prop: "gridRow",
    config: "gridRow",
  },
  "row-start": {
    prop: "gridRowStart",
    config: "gridRowStart",
  },
  "row-end": {
    prop: "gridRowEnd",
    config: "gridRowEnd",
  },
  // https://tailwindcss.com/docs/grid-auto-columns
  "auto-cols": {
    prop: "gridAutoColumns",
    config: "gridAutoColumns",
  },
  // https://tailwindcss.com/docs/grid-auto-rows
  "auto-rows": {
    prop: "gridAutoRows",
    config: "gridAutoRows",
  },
  // https://tailwindcss.com/docs/gap
  gap: {
    prop: "gap",
    config: "gap",
  },
  "gap-x": {
    prop: "columnGap",
    config: "gap",
    configFallback: "spacing",
  },
  "gap-y": {
    prop: "rowGap",
    config: "gap",
    configFallback: "spacing",
  },
  // Deprecated since tailwindcss v1.7.0
  "col-gap": {
    prop: "columnGap",
    config: "gap",
  },
  "row-gap": {
    prop: "rowGap",
    config: "gap",
  },

  /**
   * ===========================================
   * Spacing
   */
  // https://tailwindcss.com/docs/padding
  pt: {
    prop: "paddingTop",
    config: "padding",
  },
  pr: {
    prop: "paddingRight",
    config: "padding",
  },
  pb: {
    prop: "paddingBottom",
    config: "padding",
  },
  pl: {
    prop: "paddingLeft",
    config: "padding",
  },
  px: {
    prop: ["paddingLeft", "paddingRight"],
    config: "padding",
  },
  py: {
    prop: ["paddingTop", "paddingBottom"],
    config: "padding",
  },
  p: {
    prop: "padding",
    config: "padding",
  },
  // https://tailwindcss.com/docs/margin
  mt: {
    prop: "marginTop",
    config: "margin",
  },
  mr: {
    prop: "marginRight",
    config: "margin",
  },
  mb: {
    prop: "marginBottom",
    config: "margin",
  },
  ml: {
    prop: "marginLeft",
    config: "margin",
  },
  mx: {
    prop: ["marginLeft", "marginRight"],
    config: "margin",
  },
  my: {
    prop: ["marginTop", "marginBottom"],
    config: "margin",
  },
  m: {
    prop: "margin",
    config: "margin",
  },

  /**
   * ===========================================
   * Sizing
   */
  // https://tailwindcss.com/docs/width
  w: {
    prop: "width",
    config: "width",
  },
  // https://tailwindcss.com/docs/min-width
  "min-w": {
    prop: "minWidth",
    config: "minWidth",
  },
  // https://tailwindcss.com/docs/max-width
  "max-w": {
    prop: "maxWidth",
    config: "maxWidth",
  },
  // https://tailwindcss.com/docs/height
  h: {
    prop: "height",
    config: "height",
  },
  // https://tailwindcss.com/docs/min-height
  "min-h": {
    prop: "minHeight",
    config: "minHeight",
  },
  // https://tailwindcss.com/docs/max-height
  "max-h": {
    prop: "maxHeight",
    config: "maxHeight",
  },

  /**
   * ===========================================
   * Typography
   */
  font: [
    // https://tailwindcss.com/docs/font-family
    {
      prop: "fontFamily",
      config: "fontFamily",
    }, // https://tailwindcss.com/docs/font-weight
    {
      prop: "fontWeight",
      config: "fontWeight",
    },
  ],
  // https://tailwindcss.com/docs/font-smoothing
  // https://tailwindcss.com/docs/font-style
  // See staticStyles.js
  // https://tailwindcss.com/docs/letter-spacing
  tracking: {
    prop: "letterSpacing",
    config: "letterSpacing",
  },
  // https://tailwindcss.com/docs/line-height
  leading: {
    prop: "lineHeight",
    config: "lineHeight",
  },
  // https://tailwindcss.com/docs/list-style-type
  list: {
    prop: "listStyleType",
    config: "listStyleType",
  },
  // https://tailwindcss.com/docs/list-style-position
  // See staticStyles.js
  // https://tailwindcss.com/docs/placeholder-color
  // https://tailwindcss.com/docs/placeholder-opacity
  placeholder: {
    plugin: "placeholder",
  },
  // https://tailwindcss.com/docs/text-align
  // See staticStyles.js
  // https://tailwindcss.com/docs/text-color
  // https://tailwindcss.com/docs/font-size
  "text-opacity": {
    prop: "--text-opacity",
    config: "textOpacity",
    configFallback: "opacity",
  },
  text: {
    plugin: "text",
  },
  // https://tailwindcss.com/docs/text-decoration
  // https://tailwindcss.com/docs/text-transform
  // https://tailwindcss.com/docs/vertical-align
  // https://tailwindcss.com/docs/whitespace
  // https://tailwindcss.com/docs/word-break
  // See staticStyles.js

  /**
   * ===========================================
   * Backgrounds
   */
  // https://tailwindcss.com/docs/background-attachment
  // See staticStyles.js
  // https://tailwindcss.com/docs/background-repeat
  // See staticStyles.js
  // https://tailwindcss.com/docs/background-opacity
  "bg-opacity": {
    prop: "--bg-opacity",
    config: "backgroundOpacity",
    configFallback: "opacity",
  },
  // https://tailwindcss.com/docs/gradient-color-stops
  bg: {
    plugin: "bg",
  },
  // https://tailwindcss.com/docs/gradient-color-stops
  from: {
    plugin: "gradient",
  },
  via: {
    plugin: "gradient",
  },
  to: {
    plugin: "gradient",
  },

  /**
   * ===========================================
   * Borders
   */
  // https://tailwindcss.com/docs/border-style
  // See staticStyles.js
  // https://tailwindcss.com/docs/border-width
  "border-t": {
    prop: "borderTopWidth",
    config: "borderWidth",
  },
  "border-b": {
    prop: "borderBottomWidth",
    config: "borderWidth",
  },
  "border-l": {
    prop: "borderLeftWidth",
    config: "borderWidth",
  },
  "border-r": {
    prop: "borderRightWidth",
    config: "borderWidth",
  },
  "border-opacity": {
    prop: "--border-opacity",
    config: "borderOpacity",
    configFallback: "opacity",
  },
  border: {
    plugin: "border",
  },
  // https://tailwindcss.com/docs/border-radius
  "rounded-tl": {
    prop: "borderTopLeftRadius",
    config: "borderRadius",
  },
  "rounded-tr": {
    prop: "borderTopRightRadius",
    config: "borderRadius",
  },
  "rounded-br": {
    prop: "borderBottomRightRadius",
    config: "borderRadius",
  },
  "rounded-bl": {
    prop: "borderBottomLeftRadius",
    config: "borderRadius",
  },
  "rounded-t": {
    prop: ["borderTopLeftRadius", "borderTopRightRadius"],
    config: "borderRadius",
  },
  "rounded-r": {
    prop: ["borderTopRightRadius", "borderBottomRightRadius"],
    config: "borderRadius",
  },
  "rounded-b": {
    prop: ["borderBottomLeftRadius", "borderBottomRightRadius"],
    config: "borderRadius",
  },
  "rounded-l": {
    prop: ["borderTopLeftRadius", "borderBottomLeftRadius"],
    config: "borderRadius",
  },
  rounded: {
    prop: "borderRadius",
    config: "borderRadius",
  },

  /**
   * ===========================================
   * Tables
   */
  // https://tailwindcss.com/docs/border-collapse
  // https://tailwindcss.com/docs/table-layout
  // See staticStyles.js

  /**
   * ===========================================
   * Effects
   */
  // https://tailwindcss.com/docs/box-shadow
  shadow: {
    prop: "boxShadow",
    config: "boxShadow",
  },
  // https://tailwindcss.com/docs/opacity
  opacity: {
    prop: "opacity",
    config: "opacity",
  },

  /**
   * ===========================================
   * Transitions
   */
  // https://tailwindcss.com/docs/transition-property
  transition: {
    prop: "transitionProperty",
    config: "transitionProperty",
  },
  // https://tailwindcss.com/docs/transition-duration
  duration: {
    prop: "transitionDuration",
    config: "transitionDuration",
  },
  // https://tailwindcss.com/docs/transition-timing-function
  ease: {
    prop: "transitionTimingFunction",
    config: "transitionTimingFunction",
  },
  // https://tailwindcss.com/docs/transition-delay
  delay: {
    prop: "transitionDelay",
    config: "transitionDelay",
  },

  /**
   * ===========================================
   * Transforms
   */
  // https://tailwindcss.com/docs/scale
  "scale-x": {
    prop: "--transform-scale-x",
    config: "scale",
  },
  "scale-y": {
    prop: "--transform-scale-y",
    config: "scale",
  },
  scale: {
    prop: ["--transform-scale-x", "--transform-scale-y"],
    config: "scale",
  },
  // https://tailwindcss.com/docs/rotate
  rotate: {
    prop: "--transform-rotate",
    config: "rotate",
  },
  // https://tailwindcss.com/docs/translate
  "translate-x": {
    prop: "--transform-translate-x",
    config: "translate",
  },
  "translate-y": {
    prop: "--transform-translate-y",
    config: "translate",
  },
  // https://tailwindcss.com/docs/skew
  "skew-x": {
    prop: "--transform-skew-x",
    config: "skew",
  },
  "skew-y": {
    prop: "--transform-skew-y",
    config: "skew",
  },
  // https://tailwindcss.com/docs/transform-origin
  origin: {
    prop: "transformOrigin",
    config: "transformOrigin",
  },

  /**
   * ===========================================
   * Interactivity
   */
  // https://tailwindcss.com/docs/appearance
  // See staticStyles.js
  // https://tailwindcss.com/docs/cursor
  cursor: {
    prop: "cursor",
    config: "cursor",
  },
  // https://tailwindcss.com/docs/outline
  outline: {
    plugin: "outline",
  },
  // https://tailwindcss.com/docs/pointer-events
  // https://tailwindcss.com/docs/resize
  // https://tailwindcss.com/docs/user-select
  // See staticStyles.js

  /**
   * ===========================================
   * Svg
   */
  // https://tailwindcss.com/docs/fill
  fill: {
    prop: "fill",
    config: "fill",
  },
  // https://tailwindcss.com/docs/stroke
  // https://tailwindcss.com/docs/stroke
  stroke: {
    plugin: "stroke",
  },
  /**
   * ===========================================
   * Accessibility
   */
  // https://tailwindcss.com/docs/screen-readers
  // See staticStyles.js
};

// https://tailwindcss.com/docs/font-variant-numeric
// This feature uses var+comment hacks to get around property stripping:
// https://github.com/tailwindlabs/tailwindcss.com/issues/522#issuecomment-687667238
var fontVariants = {
  "--font-variant-numeric-ordinal": "var(--twin-empty,/*!*/ /*!*/)",
  "--font-variant-numeric-slashed-zero": "var(--twin-empty,/*!*/ /*!*/)",
  "--font-variant-numeric-figure": "var(--twin-empty,/*!*/ /*!*/)",
  "--font-variant-numeric-spacing": "var(--twin-empty,/*!*/ /*!*/)",
  "--font-variant-numeric-fraction": "var(--twin-empty,/*!*/ /*!*/)",
  fontVariantNumeric:
    "var(--font-variant-numeric-ordinal) var(--font-variant-numeric-slashed-zero) var(--font-variant-numeric-figure) var(--font-variant-numeric-spacing) var(--font-variant-numeric-fraction)",
};
var staticStyles = {
  /**
   * ===========================================
   * Layout
   */
  // https://tailwindcss.com/docs/container
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/box-sizing
  "box-border": {
    output: {
      boxSizing: "border-box",
    },
  },
  "box-content": {
    output: {
      boxSizing: "content-box",
    },
  },
  // https://tailwindcss.com/docs/display
  hidden: {
    output: {
      display: "none",
    },
  },
  block: {
    output: {
      display: "block",
    },
  },
  contents: {
    output: {
      display: "contents",
    },
  },
  "inline-block": {
    output: {
      display: "inline-block",
    },
  },
  inline: {
    output: {
      display: "inline",
    },
  },
  "flow-root": {
    output: {
      display: "flow-root",
    },
  },
  flex: {
    output: {
      display: "flex",
    },
  },
  "inline-flex": {
    output: {
      display: "inline-flex",
    },
  },
  grid: {
    output: {
      display: "grid",
    },
  },
  "inline-grid": {
    output: {
      display: "inline-grid",
    },
  },
  table: {
    output: {
      display: "table",
    },
  },
  "table-caption": {
    output: {
      display: "table-caption",
    },
  },
  "table-cell": {
    output: {
      display: "table-cell",
    },
  },
  "table-column": {
    output: {
      display: "table-column",
    },
  },
  "table-column-group": {
    output: {
      display: "table-column-group",
    },
  },
  "table-footer-group": {
    output: {
      display: "table-footer-group",
    },
  },
  "table-header-group": {
    output: {
      display: "table-header-group",
    },
  },
  "table-row-group": {
    output: {
      display: "table-row-group",
    },
  },
  "table-row": {
    output: {
      display: "table-row",
    },
  },
  // https://tailwindcss.com/docs/float
  "float-right": {
    output: {
      float: "right",
    },
  },
  "float-left": {
    output: {
      float: "left",
    },
  },
  "float-none": {
    output: {
      float: "none",
    },
  },
  clearfix: {
    output: {
      "::after": {
        content: '""',
        display: "table",
        clear: "both",
      },
    },
    config: false,
  },
  // https://tailwindcss.com/docs/clear
  "clear-left": {
    output: {
      clear: "left",
    },
  },
  "clear-right": {
    output: {
      clear: "right",
    },
  },
  "clear-both": {
    output: {
      clear: "both",
    },
  },
  "clear-none": {
    output: {
      clear: "none",
    },
  },
  // https://tailwindcss.com/docs/object-fit
  "object-contain": {
    output: {
      objectFit: "contain",
    },
  },
  "object-cover": {
    output: {
      objectFit: "cover",
    },
  },
  "object-fill": {
    output: {
      objectFit: "fill",
    },
  },
  "object-none": {
    output: {
      objectFit: "none",
    },
  },
  "object-scale-down": {
    output: {
      objectFit: "scale-down",
    },
  },
  // https://tailwindcss.com/docs/object-position
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/overflow
  "overflow-auto": {
    output: {
      overflow: "auto",
    },
    config: "overflow",
  },
  "overflow-hidden": {
    output: {
      overflow: "hidden",
    },
    config: "overflow",
  },
  "overflow-visible": {
    output: {
      overflow: "visible",
    },
    config: "overflow",
  },
  "overflow-scroll": {
    output: {
      overflow: "scroll",
    },
    config: "overflow",
  },
  "overflow-x-auto": {
    output: {
      overflowX: "auto",
    },
    config: "overflow",
  },
  "overflow-y-auto": {
    output: {
      overflowY: "auto",
    },
    config: "overflow",
  },
  "overflow-x-hidden": {
    output: {
      overflowX: "hidden",
    },
    config: "overflow",
  },
  "overflow-y-hidden": {
    output: {
      overflowY: "hidden",
    },
    config: "overflow",
  },
  "overflow-x-visible": {
    output: {
      overflowX: "visible",
    },
    config: "overflow",
  },
  "overflow-y-visible": {
    output: {
      overflowY: "visible",
    },
    config: "overflow",
  },
  "overflow-x-scroll": {
    output: {
      overflowX: "scroll",
    },
    config: "overflow",
  },
  "overflow-y-scroll": {
    output: {
      overflowY: "scroll",
    },
    config: "overflow",
  },
  "scrolling-touch": {
    output: {
      WebkitOverflowScrolling: "touch",
    },
    config: false,
  },
  "scrolling-auto": {
    output: {
      WebkitOverflowScrolling: "auto",
    },
    config: false,
  },
  // https://tailwindcss.com/docs/position
  static: {
    output: {
      position: "static",
    },
  },
  fixed: {
    output: {
      position: "fixed",
    },
  },
  absolute: {
    output: {
      position: "absolute",
    },
  },
  relative: {
    output: {
      position: "relative",
    },
  },
  sticky: {
    output: {
      position: "sticky",
    },
  },
  // https://tailwindcss.com/docs/top-right-bottom-left
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/visibility
  visible: {
    output: {
      visibility: "visible",
    },
  },
  invisible: {
    output: {
      visibility: "hidden",
    },
  },
  // https://tailwindcss.com/docs/z-index
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/space
  // See dynamicStyles.js for the rest
  "space-x-reverse": {
    output: {
      "> :not(template) ~ :not(template)": {
        "--space-x-reverse": 1,
      },
    },
  },
  "space-y-reverse": {
    output: {
      "> :not(template) ~ :not(template)": {
        "--space-y-reverse": 1,
      },
    },
  },
  // https://tailwindcss.com/docs/divide-width
  // See dynamicStyles.js for the rest
  "divide-x-reverse": {
    output: {
      "> :not(template) ~ :not(template)": {
        "--divide-x-reverse": 1,
      },
    },
  },
  "divide-y-reverse": {
    output: {
      "> :not(template) ~ :not(template)": {
        "--divide-y-reverse": 1,
      },
    },
  },
  // https://tailwindcss.com/docs/divide-style
  "divide-solid": {
    output: {
      "> :not(template) ~ :not(template)": {
        borderStyle: "solid",
      },
    },
  },
  "divide-dashed": {
    output: {
      "> :not(template) ~ :not(template)": {
        borderStyle: "dashed",
      },
    },
  },
  "divide-dotted": {
    output: {
      "> :not(template) ~ :not(template)": {
        borderStyle: "dotted",
      },
    },
  },
  "divide-double": {
    output: {
      "> :not(template) ~ :not(template)": {
        borderStyle: "double",
      },
    },
  },
  "divide-none": {
    output: {
      "> :not(template) ~ :not(template)": {
        borderStyle: "none",
      },
    },
  },

  /**
   * ===========================================
   * Flexbox
   */
  // https://tailwindcss.com/docs/flexbox-direction
  "flex-row": {
    output: {
      flexDirection: "row",
    },
  },
  "flex-row-reverse": {
    output: {
      flexDirection: "row-reverse",
    },
  },
  "flex-col": {
    output: {
      flexDirection: "column",
    },
  },
  "flex-col-reverse": {
    output: {
      flexDirection: "column-reverse",
    },
  },
  // https://tailwindcss.com/docs/flex-wrap
  "flex-no-wrap": {
    output: {
      flexWrap: "nowrap",
    },
  },
  "flex-wrap": {
    output: {
      flexWrap: "wrap",
    },
  },
  "flex-wrap-reverse": {
    output: {
      flexWrap: "wrap-reverse",
    },
  },
  // https://tailwindcss.com/docs/align-items
  "items-stretch": {
    output: {
      alignItems: "stretch",
    },
  },
  "items-start": {
    output: {
      alignItems: "flex-start",
    },
  },
  "items-center": {
    output: {
      alignItems: "center",
    },
  },
  "items-end": {
    output: {
      alignItems: "flex-end",
    },
  },
  "items-baseline": {
    output: {
      alignItems: "baseline",
    },
  },
  // https://tailwindcss.com/docs/align-content
  "content-start": {
    output: {
      alignContent: "flex-start",
    },
  },
  "content-center": {
    output: {
      alignContent: "center",
    },
  },
  "content-end": {
    output: {
      alignContent: "flex-end",
    },
  },
  "content-between": {
    output: {
      alignContent: "space-between",
    },
  },
  "content-around": {
    output: {
      alignContent: "space-around",
    },
  },
  // https://tailwindcss.com/docs/align-self
  "self-auto": {
    output: {
      alignSelf: "auto",
    },
  },
  "self-start": {
    output: {
      alignSelf: "flex-start",
    },
  },
  "self-center": {
    output: {
      alignSelf: "center",
    },
  },
  "self-end": {
    output: {
      alignSelf: "flex-end",
    },
  },
  "self-stretch": {
    output: {
      alignSelf: "stretch",
    },
  },
  // https://tailwindcss.com/docs/justify-content
  "justify-start": {
    output: {
      justifyContent: "flex-start",
    },
  },
  "justify-center": {
    output: {
      justifyContent: "center",
    },
  },
  "justify-end": {
    output: {
      justifyContent: "flex-end",
    },
  },
  "justify-between": {
    output: {
      justifyContent: "space-between",
    },
  },
  "justify-around": {
    output: {
      justifyContent: "space-around",
    },
  },
  "justify-evenly": {
    output: {
      justifyContent: "space-evenly",
    },
  },
  // https://tailwindcss.com/docs/flex
  // https://tailwindcss.com/docs/flex-grow
  // https://tailwindcss.com/docs/flex-shrink
  // https://tailwindcss.com/docs/order
  // See dynamicStyles.js

  /**
   * ===========================================
   * Grid
   */
  // https://tailwindcss.com/docs/grid-template-columns
  // https://tailwindcss.com/docs/grid-column
  // https://tailwindcss.com/docs/grid-template-rows
  // https://tailwindcss.com/docs/grid-row
  // https://tailwindcss.com/docs/gap
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/grid-auto-flow
  "grid-flow-row": {
    output: {
      gridAutoFlow: "row",
    },
  },
  "grid-flow-col": {
    output: {
      gridAutoFlow: "column",
    },
  },
  "grid-flow-row-dense": {
    output: {
      gridAutoFlow: "row dense",
    },
  },
  "grid-flow-col-dense": {
    output: {
      gridAutoFlow: "col dense",
    },
  },
  // https://tailwindcss.com/docs/grid-auto-columns
  // https://tailwindcss.com/docs/grid-auto-rows#app
  // See dynamicStyles.js

  /**
   * ===========================================
   * Spacing
   */
  // https://tailwindcss.com/docs/padding
  // https://tailwindcss.com/docs/margin
  // See dynamicStyles.js

  /**
   * ===========================================
   * Sizing
   */
  // https://tailwindcss.com/docs/width
  // https://tailwindcss.com/docs/min-width
  // https://tailwindcss.com/docs/max-width
  // https://tailwindcss.com/docs/height
  // https://tailwindcss.com/docs/min-height
  // https://tailwindcss.com/docs/max-height
  // See dynamicStyles.js

  /**
   * ===========================================
   * Typography
   */
  // https://tailwindcss.com/docs/font-family
  // https://tailwindcss.com/docs/font-size
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/font-smoothing
  antialiased: {
    output: {
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
    config: false,
  },
  "subpixel-antialiased": {
    output: {
      WebkitFontSmoothing: "auto",
      MozOsxFontSmoothing: "auto",
    },
    config: false,
  },
  // https://tailwindcss.com/docs/font-style
  italic: {
    output: {
      fontStyle: "italic",
    },
  },
  "not-italic": {
    output: {
      fontStyle: "normal",
    },
  },
  // https://tailwindcss.com/docs/font-weight
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/font-variant-numeric
  ordinal: {
    output: Object.assign({}, fontVariants, { "--font-variant-numeric-ordinal": "ordinal" }),
  },
  "slashed-zero": {
    output: Object.assign({}, fontVariants, {
      "--font-variant-numeric-slashed-zero": "slashed-zero",
    }),
  },
  "lining-nums": {
    output: Object.assign({}, fontVariants, { "--font-variant-numeric-figure": "lining-nums" }),
  },
  "oldstyle-nums": {
    output: Object.assign({}, fontVariants, { "--font-variant-numeric-figure": "oldstyle-nums" }),
  },
  "proportional-nums": {
    output: Object.assign({}, fontVariants, {
      "--font-variant-numeric-spacing": "proportional-nums",
    }),
  },
  "tabular-nums": {
    output: Object.assign({}, fontVariants, { "--font-variant-numeric-spacing": "tabular-nums" }),
  },
  "diagonal-fractions": {
    output: Object.assign({}, fontVariants, {
      "--font-variant-numeric-fraction": "diagonal-fractions",
    }),
  },
  "stacked-fractions": {
    output: Object.assign({}, fontVariants, {
      "--font-variant-numeric-fraction": "stacked-fractions",
    }),
  },
  "normal-nums": {
    output: {
      fontVariantNumeric: "normal",
    },
  },
  // https://tailwindcss.com/docs/letter-spacing
  // https://tailwindcss.com/docs/line-height
  // https://tailwindcss.com/docs/list-style-type
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/list-style-position
  "list-inside": {
    output: {
      listStylePosition: "inside",
    },
  },
  "list-outside": {
    output: {
      listStylePosition: "outside",
    },
  },
  // https://tailwindcss.com/docs/placeholder-color
  // https://tailwindcss.com/docs/placeholder-opacity
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/text-align
  "text-left": {
    output: {
      textAlign: "left",
    },
  },
  "text-center": {
    output: {
      textAlign: "center",
    },
  },
  "text-right": {
    output: {
      textAlign: "right",
    },
  },
  "text-justify": {
    output: {
      textAlign: "justify",
    },
  },
  // https://tailwindcss.com/docs/text-color
  // https://tailwindcss.com/docs/text-opacity
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/text-decoration
  underline: {
    output: {
      textDecoration: "underline",
    },
  },
  "line-through": {
    output: {
      textDecoration: "line-through",
    },
  },
  "no-underline": {
    output: {
      textDecoration: "none",
    },
  },
  // https://tailwindcss.com/docs/text-transform
  uppercase: {
    output: {
      textTransform: "uppercase",
    },
  },
  lowercase: {
    output: {
      textTransform: "lowercase",
    },
  },
  capitalize: {
    output: {
      textTransform: "capitalize",
    },
  },
  "normal-case": {
    output: {
      textTransform: "none",
    },
  },
  // https://tailwindcss.com/docs/vertical-align
  "align-baseline": {
    output: {
      verticalAlign: "baseline",
    },
  },
  "align-top": {
    output: {
      verticalAlign: "top",
    },
  },
  "align-middle": {
    output: {
      verticalAlign: "middle",
    },
  },
  "align-bottom": {
    output: {
      verticalAlign: "bottom",
    },
  },
  "align-text-top": {
    output: {
      verticalAlign: "text-top",
    },
  },
  "align-text-bottom": {
    output: {
      verticalAlign: "text-bottom",
    },
  },
  // https://tailwindcss.com/docs/whitespace
  "whitespace-normal": {
    output: {
      whiteSpace: "normal",
    },
  },
  "whitespace-no-wrap": {
    output: {
      whiteSpace: "nowrap",
    },
  },
  "whitespace-pre": {
    output: {
      whiteSpace: "pre",
    },
  },
  "whitespace-pre-line": {
    output: {
      whiteSpace: "pre-line",
    },
  },
  "whitespace-pre-wrap": {
    output: {
      whiteSpace: "pre-wrap",
    },
  },
  // https://tailwindcss.com/docs/word-break
  "break-normal": {
    output: {
      wordBreak: "normal",
      overflowWrap: "normal",
    },
    config: "wordbreak",
  },
  "break-words": {
    output: {
      overflowWrap: "break-word",
    },
    config: "wordbreak",
  },
  "break-all": {
    output: {
      wordBreak: "break-all",
    },
    config: "wordbreak",
  },
  truncate: {
    output: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    config: false,
  },

  /**
   * ===========================================
   * Backgrounds
   */
  // https://tailwindcss.com/docs/background-attachment
  "bg-fixed": {
    output: {
      backgroundAttachment: "fixed",
    },
  },
  "bg-local": {
    output: {
      backgroundAttachment: "local",
    },
  },
  "bg-scroll": {
    output: {
      backgroundAttachment: "scroll",
    },
  },
  // https://tailwindcss.com/docs/background-clip
  "bg-clip-border": {
    output: {
      "-webkitBackgroundClip": "border-box",
      backgroundClip: "border-box",
    },
  },
  "bg-clip-padding": {
    output: {
      "-webkitBackgroundClip": "padding-box",
      backgroundClip: "padding-box",
    },
  },
  "bg-clip-content": {
    output: {
      "-webkitBackgroundClip": "content-box",
      backgroundClip: "content-box",
    },
  },
  "bg-clip-text": {
    output: {
      "-webkitBackgroundClip": "text",
      backgroundClip: "text",
    },
  },
  // https://tailwindcss.com/docs/background-color
  // https://tailwindcss.com/docs/background-size
  // https://tailwindcss.com/docs/background-position
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/background-repeat
  "bg-repeat": {
    output: {
      backgroundRepeat: "repeat",
    },
  },
  "bg-no-repeat": {
    output: {
      backgroundRepeat: "no-repeat",
    },
  },
  "bg-repeat-x": {
    output: {
      backgroundRepeat: "repeat-x",
    },
  },
  "bg-repeat-y": {
    output: {
      backgroundRepeat: "repeat-y",
    },
  },
  "bg-repeat-round": {
    output: {
      backgroundRepeat: "round",
    },
  },
  "bg-repeat-space": {
    output: {
      backgroundRepeat: "space",
    },
  },
  // https://tailwindcss.com/docs/background-size
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/gradient-color-stops
  // See dynamicStyles.js

  /**
   * ===========================================
   * Borders
   */
  // https://tailwindcss.com/docs/border-color
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/border-style
  "border-solid": {
    output: {
      borderStyle: "solid",
    },
  },
  "border-dashed": {
    output: {
      borderStyle: "dashed",
    },
  },
  "border-dotted": {
    output: {
      borderStyle: "dotted",
    },
  },
  "border-double": {
    output: {
      borderStyle: "double",
    },
  },
  "border-none": {
    output: {
      borderStyle: "none",
    },
  },
  // https://tailwindcss.com/docs/border-width
  // https://tailwindcss.com/docs/border-radius
  // See dynamicStyles.js

  /**
   * ===========================================
   * Tables
   */
  // https://tailwindcss.com/docs/border-collapse
  "border-collapse": {
    output: {
      borderCollapse: "collapse",
    },
  },
  "border-separate": {
    output: {
      borderCollapse: "separate",
    },
  },
  // https://tailwindcss.com/docs/table-layout
  "table-auto": {
    output: {
      tableLayout: "auto",
    },
  },
  "table-fixed": {
    output: {
      tableLayout: "fixed",
    },
  },

  /**
   * ===========================================
   * Effects
   */
  // https://tailwindcss.com/docs/box-shadow/
  // https://tailwindcss.com/docs/opacity
  // See dynamicStyles.js

  /**
   * ===========================================
   * Transitions
   */
  // https://tailwindcss.com/docs/transition-property
  // https://tailwindcss.com/docs/transition-duration
  // https://tailwindcss.com/docs/transition-timing-function
  // See dynamicStyles.js

  /**
   * ===========================================
   * Transforms
   */
  // https://tailwindcss.com/docs/scale
  // https://tailwindcss.com/docs/rotate
  // https://tailwindcss.com/docs/translate
  // https://tailwindcss.com/docs/skew
  // https://tailwindcss.com/docs/transform-origin
  // See dynamicStyles.js

  /**
   * ===========================================
   * Interactivity
   */
  // https://tailwindcss.com/docs/appearance
  "appearance-none": {
    output: {
      appearance: "none",
    },
  },
  // https://tailwindcss.com/docs/cursor
  // https://tailwindcss.com/docs/outline
  // See dynamicStyles.js
  // https://tailwindcss.com/docs/pointer-events
  "pointer-events-none": {
    output: {
      pointerEvents: "none",
    },
  },
  "pointer-events-auto": {
    output: {
      pointerEvents: "auto",
    },
  },
  // https://tailwindcss.com/docs/resize
  "resize-none": {
    output: {
      resize: "none",
    },
  },
  "resize-y": {
    output: {
      resize: "vertical",
    },
  },
  "resize-x": {
    output: {
      resize: "horizontal",
    },
  },
  resize: {
    output: {
      resize: "both",
    },
  },
  // https://tailwindcss.com/docs/user-select
  "select-none": {
    output: {
      userSelect: "none",
    },
  },
  "select-text": {
    output: {
      userSelect: "text",
    },
  },
  "select-all": {
    output: {
      userSelect: "all",
    },
  },
  "select-auto": {
    output: {
      userSelect: "auto",
    },
  },

  /**
   * ===========================================
   * Svg
   */
  // https://tailwindcss.com/docs/fill
  // https://tailwindcss.com/docs/stroke
  // https://tailwindcss.com/docs/stroke
  // See dynamicStyles.js

  /**
   * ===========================================
   * Accessibility
   */
  // https://tailwindcss.com/docs/screen-readers
  "sr-only": {
    output: {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      borderWidth: "0",
    },
    config: "accessibility",
  },
  "not-sr-only": {
    output: {
      position: "static",
      width: "auto",
      height: "auto",
      padding: "0",
      margin: "0",
      overflow: "visible",
      clip: "auto",
      whiteSpace: "normal",
    },
    config: "accessibility",
  },
  // Overscroll
  "overscroll-auto": {
    output: {
      "overscroll-behavior": "auto",
    },
  },
  "overscroll-contain": {
    output: {
      "overscroll-behavior": "contain",
    },
  },
  "overscroll-none": {
    output: {
      "overscroll-behavior": "none",
    },
  },
  "overscroll-y-auto": {
    output: {
      "overscroll-behavior-y": "auto",
    },
  },
  "overscroll-y-contain": {
    output: {
      "overscroll-behavior-y": "contain",
    },
  },
  "overscroll-y-none": {
    output: {
      "overscroll-behavior-y": "none",
    },
  },
  "overscroll-x-auto": {
    output: {
      "overscroll-behavior-x": "auto",
    },
  },
  "overscroll-x-contain": {
    output: {
      "overscroll-behavior-x": "contain",
    },
  },
  "overscroll-x-none": {
    output: {
      "overscroll-behavior-x": "none",
    },
  },
  // Grid alignment utilities
  // https://github.com/tailwindlabs/tailwindcss/pull/2306
  "justify-items-auto": {
    output: {
      justifyItems: "auto",
    },
  },
  "justify-items-start": {
    output: {
      justifyItems: "start",
    },
  },
  "justify-items-end": {
    output: {
      justifyItems: "end",
    },
  },
  "justify-items-center": {
    output: {
      justifyItems: "center",
    },
  },
  "justify-items-stretch": {
    output: {
      justifyItems: "stretch",
    },
  },
  "justify-self-auto": {
    output: {
      justifySelf: "auto",
    },
  },
  "justify-self-start": {
    output: {
      justifySelf: "start",
    },
  },
  "justify-self-end": {
    output: {
      justifySelf: "end",
    },
  },
  "justify-self-center": {
    output: {
      justifySelf: "center",
    },
  },
  "justify-self-stretch": {
    output: {
      justifySelf: "stretch",
    },
  },
  "place-content-center": {
    output: {
      placeContent: "center",
    },
  },
  "place-content-start": {
    output: {
      placeContent: "start",
    },
  },
  "place-content-end": {
    output: {
      placeContent: "end",
    },
  },
  "place-content-between": {
    output: {
      placeContent: "space-between",
    },
  },
  "place-content-around": {
    output: {
      placeContent: "space-around",
    },
  },
  "place-content-evenly": {
    output: {
      placeContent: "space-evenly",
    },
  },
  "place-content-stretch": {
    output: {
      placeContent: "stretch",
    },
  },
  "place-items-auto": {
    output: {
      placeItems: "auto",
    },
  },
  "place-items-start": {
    output: {
      placeItems: "start",
    },
  },
  "place-items-end": {
    output: {
      placeItems: "end",
    },
  },
  "place-items-center": {
    output: {
      placeItems: "center",
    },
  },
  "place-items-stretch": {
    output: {
      placeItems: "stretch",
    },
  },
  "place-self-auto": {
    output: {
      placeSelf: "auto",
    },
  },
  "place-self-start": {
    output: {
      placeSelf: "start",
    },
  },
  "place-self-end": {
    output: {
      placeSelf: "end",
    },
  },
  "place-self-center": {
    output: {
      placeSelf: "center",
    },
  },
  "place-self-stretch": {
    output: {
      placeSelf: "stretch",
    },
  },

  /**
   * ===========================================
   * Special classes
   */
  transform: {
    output: {
      "--transform-translate-x": "0",
      "--transform-translate-y": "0",
      "--transform-rotate": "0",
      "--transform-skew-x": "0",
      "--transform-skew-y": "0",
      "--transform-scale-x": "1",
      "--transform-scale-y": "1",
      transform:
        "translateX(var(--transform-translate-x)) translateY(var(--transform-translate-y)) rotate(var(--transform-rotate)) skewX(var(--transform-skew-x)) skewY(var(--transform-skew-y)) scaleX(var(--transform-scale-x)) scaleY(var(--transform-scale-y))",
    },
    config: false,
  },

  /**
   * ===========================================
   * Extras
   * Extra styles that aren't part of Tailwind
   */
  content: {
    output: {
      content: '""',
    },
    config: false,
  },
};

/**
 * Pseudo-classes (Variants)
 * In Twin, these are always available on just about any class
 *
 * See MDN web docs for more information
 * https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes
 */
var variantConfig = {
  // Before/after pseudo elements
  // Usage: tw`before:(content block w-10 h-10 bg-black)`
  before: ":before",
  after: ":after",
  // Interactive links/buttons
  hover: ":hover",
  // Tailwind
  focus: ":focus",
  // Tailwind
  active: ":active",
  // Tailwind
  visited: ":visited",
  // Tailwind
  hocus: ":hover, :focus",
  link: ":link",
  target: ":target",
  "focus-visible": ":focus-visible",
  // Tailwind
  "focus-within": ":focus-within",
  // Tailwind
  // Form element states
  disabled: ":disabled",
  // Tailwind
  checked: ":checked",
  // Tailwind
  "not-checked": ":not(:checked)",
  default: ":default",
  enabled: ":enabled",
  indeterminate: ":indeterminate",
  invalid: ":invalid",
  valid: ":valid",
  optional: ":optional",
  required: ":required",
  "placeholder-shown": ":placeholder-shown",
  "read-only": ":read-only",
  "read-write": ":read-write",
  // Child selectors
  "not-disabled": ":not(:disabled)",
  "first-of-type": ":first-of-type",
  "not-first-of-type": ":not(:first-of-type)",
  "last-of-type": ":last-of-type",
  "not-last-of-type": ":not(:last-of-type)",
  first: ":first-child",
  // Tailwind
  "not-first": ":not(:first-child)",
  last: ":last-child",
  // Tailwind
  "not-last": ":not(:last-child)",
  "only-child": ":only-child",
  "not-only-child": ":not(:only-child)",
  "only-of-type": ":only-of-type",
  "not-only-of-type": ":not(:only-of-type)",
  even: ":nth-child(even)",
  // Tailwind
  odd: ":nth-child(odd)",
  // Tailwind
  "even-of-type": ":nth-of-type(even)",
  "odd-of-type": ":nth-of-type(odd)",
  svg: "svg",
  all: "*",
  "all-child": "> *",
  // Group states
  // You'll need to add className="group" to an ancestor to make these work
  // https://github.com/ben-rogerson/twin.macro/blob/master/docs/group.md
  "group-hover": function (variantData) {
    return generateGroupSelector(".group:hover &", variantData);
  },
  // Tailwind
  "group-focus": function (variantData) {
    return generateGroupSelector(".group:focus &", variantData);
  },
  // Tailwind
  "group-hocus": function (variantData) {
    return generateGroupSelector(".group:hover &, .group:focus &", variantData);
  },
  "group-active": function (variantData) {
    return generateGroupSelector(".group:active &", variantData);
  },
  "group-visited": function (variantData) {
    return generateGroupSelector(".group:visited &", variantData);
  },
  // Motion control
  // https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
  "motion-safe": "@media (prefers-reduced-motion: no-preference)",
  "motion-reduce": "@media (prefers-reduced-motion: reduce)",
  // Dark theme
  dark: function (ref) {
    var hasGroupVariant = ref.hasGroupVariant;
    var config = ref.config;
    var errorCustom = ref.errorCustom;

    var styles =
      {
        // Media strategy: The default when you prepend with dark, tw`dark:block`
        media: "@media (prefers-color-scheme: dark)",
        // Class strategy: In your tailwind.config.js, add `{ dark: 'class' }
        // then add a `className="dark"` on a parent element.
        class: !hasGroupVariant && ".dark &",
      }[config("dark") || "media"] || null;

    if (!styles && !hasGroupVariant) {
      errorCustom(
        "The `dark` config option must be either `{ dark: 'media' }` (default) or `{ dark: 'class' }`"
      );
    }

    return styles;
  },
  // Light theme
  light: function (ref) {
    var hasGroupVariant = ref.hasGroupVariant;
    var config = ref.config;
    var errorCustom = ref.errorCustom;

    var styles =
      {
        // Media strategy: The default when you prepend with light, tw`light:block`
        media: "@media (prefers-color-scheme: light)",
        // Class strategy: In your tailwind.config.js, add `{ light: 'class' }
        // then add a `className="light"` on a parent element.
        class: !hasGroupVariant && ".light &",
      }[config("light") || config("dark") || "media"] || null;

    if (!styles && !hasGroupVariant) {
      if (config("light")) {
        errorCustom(
          "The `light` config option must be either `{ light: 'media' }` (default) or `{ light: 'class' }`"
        );
      }

      errorCustom(
        "The `dark` config option must be either `{ dark: 'media' }` (default) or `{ dark: 'class' }`"
      );
    }

    return styles;
  },
};

var generateGroupSelector = function (className, ref) {
  var hasDarkVariant = ref.hasDarkVariant;
  var hasLightVariant = ref.hasLightVariant;
  var config = ref.config;

  var themeVariant =
    (hasDarkVariant && config("dark") === "class" && ["dark ", "dark"]) ||
    (hasLightVariant &&
      (config("light") === "class" || config("dark") === "class") && ["light ", "light"]);
  return themeVariant
    ? themeVariant
        .map(function (v) {
          return className
            .split(", ")
            .map(function (cn) {
              return "." + v + cn;
            })
            .join(", ");
        })
        .join(", ")
    : className;
};

function objectWithoutProperties(obj, exclude) {
  var target = {};
  for (var k in obj)
    if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1)
      target[k] = obj[k];
  return target;
}

var getCustomSuggestions = function (className) {
  var suggestions = {
    "align-center": "items-center",
    "center-align": "items-center",
    "flex-center": "items-center / justify-center",
    "inline-block": "block",
    "display-none": "hidden",
    "display-inline": "inline-block",
    "display-flex": "flex",
    "border-radius": "rounded",
    "flex-column": "flex-col",
    "flex-column-reverse": "flex-col-reverse",
    "text-italic": "italic",
    "text-normal": "not-italic",
  }[className];
  if (suggestions) {
    return suggestions;
  }
};

var flattenObject = function (object, prefix) {
  if (prefix === void 0) prefix = "";

  return Object.keys(object).reduce(function (result, k) {
    var pre = prefix.length > 0 ? prefix + "-" : "";
    var value = object[k];
    var fullKey = pre + k;

    if (Array.isArray(value)) {
      result[fullKey] = value;
    } else if (typeof value === "object") {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }

    return result;
  }, {});
};

var targetTransforms = [
  function (ref) {
    var target = ref.target;

    return target === "default" ? "" : target;
  },
  function (ref) {
    var target = ref.target;

    return target.endsWith("-default") ? target.slice(0, -8) : target;
  },
  function (ref) {
    var dynamicKey = ref.dynamicKey;
    var target = ref.target;

    var prefix = target !== stripNegative(target) ? "-" : "";
    return "" + prefix + [dynamicKey, stripNegative(target)].filter(Boolean).join("-");
  },
];

var filterKeys = function (object, negativesOnly) {
  return Object.entries(object).reduce(function (result, ref) {
    var obj;

    var k = ref[0];
    var v = ref[1];
    return Object.assign(
      {},
      result,
      (negativesOnly ? k.startsWith("-") : !k.startsWith("-")) && ((obj = {}), (obj[k] = v), obj)
    );
  }, {});
};

var normalizeDynamicConfig = function (ref) {
  var config = ref.config;
  var input = ref.input;
  var dynamicKey = ref.dynamicKey;
  var hasNegative = ref.hasNegative;

  return Object.entries(filterKeys(flattenObject(config), hasNegative))
    .map(function (ref) {
      var target = ref[0];
      var value = ref[1];

      return Object.assign(
        {},
        input && {
          rating: stringSimilarity.compareTwoStrings("-" + target, input),
        },
        {
          target: targetTransforms.reduce(function (result, transformer) {
            return transformer({
              dynamicKey: dynamicKey,
              target: result,
            });
          }, target),
          value: "" + value,
        }
      );
    })
    .filter(function (i) {
      return !i.target.includes("-array-") && (typeof i.rating === "undefined" || i.rating >= 0.15);
    });
};

var matchConfig = function (ref) {
  var config = ref.config;
  var theme = ref.theme;
  var className = ref.className;
  var rest$1 = objectWithoutProperties(ref, ["config", "theme", "className"]);
  var rest = rest$1;

  return Object.values(
    [].concat(config).reduce(function (results, item) {
      return Object.assign(
        {},
        results,
        normalizeDynamicConfig(Object.assign({}, { config: theme(item), input: className }, rest))
      );
    }, {})
  ).sort(function (a, b) {
    return b.rating - a.rating;
  });
};

var getConfig = function (properties) {
  return matchConfig(Object.assign({}, properties, { className: null })).slice(0, 20);
};

var getSuggestions = function (ref) {
  var ref_pieces = ref.pieces;
  var className = ref_pieces.className;
  var hasNegative = ref_pieces.hasNegative;
  var state = ref.state;
  var config = ref.config;
  var dynamicKey = ref.dynamicKey;

  var theme = getTheme(state.config.theme);
  var customSuggestions = getCustomSuggestions(className);
  if (customSuggestions) {
    return customSuggestions;
  }

  if (config) {
    var properties = {
      config: config,
      theme: theme,
      dynamicKey: dynamicKey,
      className: className,
      hasNegative: hasNegative,
    };
    var dynamicMatches = matchConfig(properties);
    if (dynamicMatches.length === 0) {
      return getConfig(properties);
    } // If there's a high rated suggestion then return it

    var trumpMatch$1 = dynamicMatches.find(function (match) {
      return match.rating >= 0.6;
    });
    if (trumpMatch$1) {
      return trumpMatch$1.target;
    }
    return dynamicMatches;
  } // Static or unmatched className

  var staticClassNames = Object.keys(staticStyles);
  var dynamicClassMatches = Object.entries(dynamicStyles)
    .map(function (ref) {
      var k = ref[0];
      var v = ref[1];

      return typeof v === "object" ? (v.default ? [k, v].join("-") : k + "-...") : null;
    })
    .filter(Boolean);
  var matches = stringSimilarity
    .findBestMatch(className, staticClassNames.concat(dynamicClassMatches))
    .ratings.filter(function (i) {
      return i.rating > 0.25;
    });
  var hasNoMatches = matches.every(function (i) {
    return i.rating === 0;
  });
  if (hasNoMatches) {
    return [];
  }
  var trumpMatch = matches.find(function (match) {
    return match.rating >= 0.6;
  });
  if (trumpMatch) {
    return trumpMatch.target;
  }
  return matches
    .sort(function (a, b) {
      return b.rating - a.rating;
    })
    .slice(0, 6);
};

var color = {
  error: chalk.hex("#ff8383"),
  errorLight: chalk.hex("#ffd3d3"),
  success: chalk.greenBright,
  highlight: chalk.yellowBright,
  highlight2: chalk.blue,
  subdued: chalk.hex("#999"),
};

var spaced = function (string) {
  return "\n\n" + string + "\n";
};

var warning = function (string) {
  return color.error("✕ " + string);
};

var inOutPlugins = function (input, output) {
  return color.highlight2("→") + " " + input + " " + color.highlight2(JSON.stringify(output));
};

var inOut = function (input, output) {
  return color.success("✓") + " " + input + " " + color.success(JSON.stringify(output));
};

var logNoVariant = function (variant, validVariants) {
  return spaced(
    warning("The variant “" + variant + ":” was not found") +
      "\n\n" +
      Object.entries(validVariants)
        .map(function (ref) {
          var k = ref[0];
          var v = ref[1];

          return (
            k +
            "\n" +
            v
              .map(function (item, index) {
                return (
                  "" +
                  (v.length > 6 && index % 6 === 0 && index > 0 ? "\n" : "") +
                  color.highlight(item) +
                  ":"
                );
              })
              .join(color.subdued(" / "))
          );
        })
        .join("\n\n")
  );
};

var logNotAllowed = function (ref) {
  var className = ref.className;
  var error = ref.error;

  return spaced(warning(color.errorLight("" + className) + " " + error));
}; // TODO: Wrap this in spaced

var logBadGood = function (bad, good) {
  return color.error("✕ Bad:") + " " + bad + "\n" + color.success("✓ Good:") + " " + good;
};

var logErrorFix = function (error, good) {
  return color.error(error) + "\n" + color.success("Fix:") + " " + good;
};

var logGeneralError = function (error) {
  return spaced(warning(error));
};

var debug = function (className, log) {
  return console.log(inOut(className, log));
};

var debugPlugins = function (processedPlugins) {
  console.log(
    Object.entries(processedPlugins)
      .map(function (ref) {
        var group = ref[1];

        return Object.entries(group)
          .map(function (ref) {
            var className = ref[0];
            var styles = ref[1];

            return inOutPlugins(className, styles);
          })
          .join("\n");
      })
      .join("\n")
  );
};

var formatSuggestions = function (suggestions, lineLength, maxLineLength) {
  if (lineLength === void 0) lineLength = 0;
  if (maxLineLength === void 0) maxLineLength = 60;

  return suggestions
    .map(function (s, index) {
      lineLength = lineLength + ("" + s.target + s.value).length;
      var divider =
        lineLength > maxLineLength
          ? "\n"
          : index !== suggestions.length - 1
          ? color.subdued(" / ")
          : "";
      if (lineLength > maxLineLength) {
        lineLength = 0;
      }
      return (
        "" +
        color.highlight(s.target) +
        (s.value ? color.subdued(" [" + s.value + "]") : "") +
        divider
      );
    })
    .join("");
};

var logNoClass = function (properties) {
  var classNameRawNoVariants = properties.pieces.classNameRawNoVariants;
  var text = warning(
    (classNameRawNoVariants ? color.errorLight(classNameRawNoVariants) : "Class") + " was not found"
  );
  return text;
};

var logDeeplyNestedClass = function (properties) {
  var classNameRawNoVariants = properties.pieces.classNameRawNoVariants;
  var text = warning(
    (classNameRawNoVariants ? color.errorLight(classNameRawNoVariants) : "Class") +
      " is too deeply nested in your tailwind.config.js"
  );
  return text;
};

var errorSuggestions = function (properties) {
  var hasSuggestions = properties.state.configTwin.hasSuggestions;
  var className = properties.pieces.className;
  var textNotFound = logNoClass(properties);
  if (!hasSuggestions) {
    return spaced(textNotFound);
  }
  var suggestions = getSuggestions(properties);
  if (suggestions.length === 0) {
    return spaced(textNotFound);
  }

  if (typeof suggestions === "string") {
    if (suggestions === className) {
      return spaced(logDeeplyNestedClass(properties));
    }

    return spaced(textNotFound + "\n\nDid you mean " + color.highlight(suggestions) + "?");
  }

  var suggestionText =
    suggestions.length === 1
      ? "Did you mean " + color.highlight(suggestions.shift().target) + "?"
      : "Try one of these classes:\n" + formatSuggestions(suggestions);
  return spaced(textNotFound + "\n\n" + suggestionText);
};

var themeErrorNotFound = function (ref) {
  var theme = ref.theme;
  var input = ref.input;
  var trimInput = ref.trimInput;

  if (typeof theme === "string") {
    return spaced(logBadGood(input, trimInput));
  }

  var textNotFound = warning(color.errorLight(input) + " was not found in your theme");

  if (!theme) {
    return spaced(textNotFound);
  }

  var suggestionText =
    "Try one of these values:\n" +
    formatSuggestions(
      Object.entries(theme).map(function (ref) {
        var k = ref[0];
        var v = ref[1];

        return {
          target: k,
          value: typeof v === "string" ? v : "...",
        };
      })
    );
  return spaced(textNotFound + "\n\n" + suggestionText);
};

var logNotFoundVariant = function (ref) {
  var classNameRaw = ref.classNameRaw;

  return spaced(
    logBadGood(
      "" + classNameRaw,
      [classNameRaw + "flex", classNameRaw + "(flex bg-black)"].join(color.subdued(" / "))
    )
  );
};

var logNotFoundClass = logGeneralError("That class was not found");
var logStylePropertyError = spaced(
  logErrorFix(
    "Styles shouldn’t be added within a `style={...}` prop",
    'Use the tw or css prop instead: <div tw="" /> or <div css={tw``} />\n\nDisable this error by adding this in your twin config: `{ "allowStyleProp": true }`\nRead more at https://twinredirect.page.link/style-prop'
  )
);

var getConfigTailwindProperties = function (state, config) {
  var configPath = "./tailwind.config.js";
  var configExists = !!config.tailwindConfig;
  var configTailwind = configExists
    ? resolveTailwindConfig([config.tailwindConfig, defaultTailwindConfig])
    : resolveTailwindConfig([defaultTailwindConfig]);

  if (!configTailwind) {
    throw new MacroError("Couldn’t find the Tailwind config");
  }

  return {
    configPath: configPath,
    configExists: configExists,
    configTailwind: configTailwind,
  };
};

var runConfigValidator = function (ref) {
  var item = ref[0];
  var value = ref[1];

  var validatorConfig = configTwinValidators[item];
  if (!validatorConfig) {
    return true;
  }
  var validator = validatorConfig[0];
  var errorMessage = validatorConfig[1];
  throwIf(validator(value) !== true, function () {
    return logGeneralError(errorMessage);
  });
  return true;
};

var getConfigTwin = function (config, state) {
  return Object.assign({}, configTwinDefaults(state), config);
};

var getConfigTwinValidated = function (config, state) {
  return Object.entries(getConfigTwin(config, state)).reduce(function (result, item) {
    var obj;

    return Object.assign(
      {},
      result,
      runConfigValidator(item) && ((obj = {}), (obj[item[0]] = item[1]), obj)
    );
  }, {});
};

var isStaticClass = function (className) {
  var staticConfig = dlv(staticStyles, [className, "config"]);
  var staticConfigOutput = dlv(staticStyles, [className, "output"]);
  var staticConfigKey = staticConfigOutput ? Object.keys(staticConfigOutput).shift() : null;
  return Boolean(staticConfig || staticConfigKey);
};

var getDynamicProperties = function (className) {
  // Get an array of matches (eg: ['col', 'col-span'])
  var dynamicKeyMatches =
    Object.keys(dynamicStyles).filter(function (k) {
      return className.startsWith(k + "-") || className === k;
    }) || []; // Get the best match from the match array

  var dynamicKey = dynamicKeyMatches.reduce(function (r, match) {
    return r.length < match.length ? match : r;
  }, []);
  var dynamicConfig = dlv(dynamicStyles, dynamicKey); // See if the config property is defined

  var isDynamicClass = Boolean(
    Array.isArray(dynamicConfig)
      ? dynamicConfig.map(function (i) {
          return dlv(i, "config");
        })
      : dlv(dynamicStyles, [dynamicKey, "config"])
  );
  return {
    isDynamicClass: isDynamicClass,
    dynamicConfig: dynamicConfig,
    dynamicKey: dynamicKey,
  };
};

var isEmpty$1 = function (value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0)
  );
};

var getProperties = function (className, state) {
  if (!className) {
    return;
  }
  var isStatic = isStaticClass(className);
  var ref = getDynamicProperties(className);
  var isDynamicClass = ref.isDynamicClass;
  var dynamicConfig = ref.dynamicConfig;
  var dynamicKey = ref.dynamicKey;
  var corePlugin = dynamicConfig.plugin;
  var hasUserPlugins = !isEmpty$1(state.config.plugins);
  var type =
    (isStatic && "static") || (isDynamicClass && "dynamic") || (corePlugin && "corePlugin");
  return {
    type: type,
    corePlugin: corePlugin,
    hasMatches: Boolean(type),
    dynamicKey: dynamicKey,
    dynamicConfig: dynamicConfig,
    hasUserPlugins: hasUserPlugins,
  };
};

function hasAlpha(color) {
  return (
    color.startsWith("rgba(") ||
    color.startsWith("hsla(") ||
    (color.startsWith("#") && color.length === 9) ||
    (color.startsWith("#") && color.length === 5)
  );
}

function toRgba(color) {
  var ref = createColor(color).rgb().array();
  var r = ref[0];
  var g = ref[1];
  var b = ref[2];
  var a = ref[3];
  return [r, g, b, a === undefined && hasAlpha(color) ? 1 : a];
}

var withAlpha = function (ref) {
  var obj, obj$1, obj$2, obj$3;

  var color = ref.color;
  var property = ref.property;
  var variable = ref.variable;
  var important = ref.important;
  if (typeof color === "function") {
    return (
      (obj = {}),
      (obj[property] =
        "" +
        color({
          opacityVariable: variable,
        }) +
        important),
      obj
    );
  }

  var colorValue = "" + color + important;

  try {
    var ref$1 = toRgba(color);
    var r = ref$1[0];
    var g = ref$1[1];
    var b = ref$1[2];
    var a = ref$1[3];

    if (a !== undefined || !variable) {
      return (obj$1 = {}), (obj$1[property] = colorValue), obj$1;
    }

    return (
      (obj$2 = {}),
      (obj$2[variable] = "1"),
      (obj$2[property] =
        "rgba(" + r + ", " + g + ", " + b + ", var(" + variable + "))" + important),
      obj$2
    );
  } catch (_) {
    return (obj$3 = {}), (obj$3[property] = colorValue), obj$3;
  }
};

var SPREAD_ID = "__spread__";
var COMPUTED_ID = "__computed__";

function addImport(ref) {
  var t = ref.types;
  var program = ref.program;
  var mod = ref.mod;
  var name = ref.name;
  var identifier = ref.identifier;

  var importName =
    name === "default"
      ? [t.importDefaultSpecifier(identifier)]
      : name
      ? [t.importSpecifier(identifier, t.identifier(name))]
      : [];
  program.unshiftContainer("body", t.importDeclaration(importName, t.stringLiteral(mod)));
}

function objectExpressionElements(literal, t, spreadType) {
  return Object.keys(literal)
    .filter(function (k) {
      return typeof literal[k] !== "undefined";
    })
    .map(function (k) {
      if (k.startsWith(SPREAD_ID)) {
        return t[spreadType](babylon.parseExpression(literal[k]));
      }

      var computed = k.startsWith(COMPUTED_ID);
      var key = computed ? babylon.parseExpression(k.slice(12)) : t.stringLiteral(k);
      return t.objectProperty(key, astify(literal[k], t), computed);
    });
}

function astify(literal, t) {
  if (literal === null) {
    return t.nullLiteral();
  }

  switch (typeof literal) {
    case "function":
      return t.unaryExpression("void", t.numericLiteral(0), true);

    case "number":
      return t.numericLiteral(literal);

    case "boolean":
      return t.booleanLiteral(literal);

    case "undefined":
      return t.unaryExpression("void", t.numericLiteral(0), true);

    case "string":
      if (literal.startsWith(COMPUTED_ID)) {
        return babylon.parseExpression(literal.slice(COMPUTED_ID.length));
      }

      return t.stringLiteral(literal);

    default:
      // TODO: When is the literal an array? It's only an object/string
      if (Array.isArray(literal)) {
        return t.arrayExpression(
          literal.map(function (x) {
            return astify(x, t);
          })
        );
      } // TODO: This is horrible, clean it up

      try {
        return t.objectExpression(objectExpressionElements(literal, t, "spreadElement"));
      } catch (_) {
        return t.objectExpression(objectExpressionElements(literal, t, "spreadProperty"));
      }
  }
}

var setStyledIdentifier = function (ref) {
  var state = ref.state;
  var path$$1 = ref.path;
  var styledImport = ref.styledImport;

  if (path$$1.node.source.value !== styledImport.from) {
    return;
  } // Look for an existing import that matches the config,
  // if found then reuse it for the rest of the function calls

  path$$1.node.specifiers.some(function (specifier) {
    if (specifier.type === "ImportDefaultSpecifier" && styledImport.import === "default") {
      state.styledIdentifier = specifier.local;
      return true;
    }

    if (specifier.imported && specifier.imported.name === styledImport.import) {
      state.styledIdentifier = specifier.local;
      return true;
    }

    return false;
  });
};

var setCssIdentifier = function (ref) {
  var state = ref.state;
  var path$$1 = ref.path;
  var cssImport = ref.cssImport;

  if (path$$1.node.source.value !== cssImport.from) {
    return;
  } // Look for an existing import that matches the config,
  // if found then reuse it for the rest of the function calls

  path$$1.node.specifiers.some(function (specifier) {
    if (specifier.type === "ImportDefaultSpecifier" && cssImport.import === "default") {
      state.cssIdentifier = specifier.local;
      return true;
    }

    if (specifier.imported && specifier.imported.name === cssImport.import) {
      state.cssIdentifier = specifier.local;
      return true;
    }

    return false;
  });
};

function parseTte(ref) {
  var path$$1 = ref.path;
  var t = ref.types;
  var styledIdentifier = ref.styledIdentifier;
  var state = ref.state;

  var cloneNode = t.cloneNode || t.cloneDeep;
  if (
    path$$1.node.tag.type !== "Identifier" &&
    path$$1.node.tag.type !== "MemberExpression" &&
    path$$1.node.tag.type !== "CallExpression"
  ) {
    return null;
  }
  var string = path$$1.get("quasi").evaluate().value;
  var stringLoc = path$$1.get("quasi").node.loc;

  if (path$$1.node.tag.type === "CallExpression") {
    replaceWithLocation(path$$1.get("tag").get("callee"), cloneNode(styledIdentifier));
    state.shouldImportStyled = true;
  } else if (path$$1.node.tag.type === "MemberExpression") {
    replaceWithLocation(path$$1.get("tag").get("object"), cloneNode(styledIdentifier));
    state.shouldImportStyled = true;
  }

  if (path$$1.node.tag.type === "CallExpression" || path$$1.node.tag.type === "MemberExpression") {
    replaceWithLocation(
      path$$1,
      t.callExpression(cloneNode(path$$1.node.tag), [t.identifier("__twPlaceholder")])
    );
    path$$1 = path$$1.get("arguments")[0];
  }

  path$$1.node.loc = stringLoc;
  return {
    string: string,
    path: path$$1,
  };
}

function replaceWithLocation(path$$1, replacement) {
  var newPaths = replacement ? path$$1.replaceWith(replacement) : [];

  if (Array.isArray(newPaths) && newPaths.length > 0) {
    var ref = path$$1.node;
    var loc = ref.loc;
    newPaths.forEach(function (p) {
      p.node.loc = loc;
    });
  }

  return newPaths;
}

var validImports = new Set([
  "default",
  "styled",
  "css",
  "theme",
  "TwStyle",
  "ThemeStyle",
  "GlobalStyles",
]);

var validateImports = function (imports) {
  var unsupportedImport = Object.keys(imports).find(function (reference) {
    return !validImports.has(reference);
  });
  var importTwAsNamedNotDefault = Object.keys(imports).find(function (reference) {
    return reference === "tw";
  });
  throwIf(importTwAsNamedNotDefault, function () {
    logGeneralError(
      "Please use the default export for twin.macro, i.e:\nimport tw from 'twin.macro'\nNOT import { tw } from 'twin.macro'"
    );
  });
  throwIf(unsupportedImport, function () {
    return logGeneralError(
      "Twin doesn't recognize { " +
        unsupportedImport +
        " }\n\nTry one of these imports:\nimport tw, { styled, css, theme } from 'twin.macro'"
    );
  });
};

var generateUid = function (name, program) {
  return program.scope.generateUidIdentifier(name);
};

/**
 * Config presets
 *
 * To use, add the preset in package.json/babel macro config:
 *
 * Styled components
 * { "babelMacros": { "twin": { "preset": "styled-components" } } }
 * module.exports = { twin: { preset: "styled-components" } }
 *
 * Emotion
 * { "babelMacros": { "twin": { "preset": "emotion" } } }
 * module.exports = { twin: { preset: "emotion" } }
 *
 * Goober
 * { "babelMacros": { "twin": { "preset": "goober" } } }
 * module.exports = { twin: { preset: "goober" } }
 */
var userPresets = {
  "styled-components": {
    styled: {
      import: "default",
      from: "styled-components",
    },
    css: {
      import: "css",
      from: "styled-components/macro",
    },
    global: {
      import: "createGlobalStyle",
      from: "styled-components",
    },
  },
  emotion: {
    styled: {
      import: "default",
      from: "@emotion/styled",
    },
    css: {
      import: "css",
      from: "@emotion/core",
    },
    global: {
      import: "Global",
      from: "@emotion/core",
    },
  },
  goober: {
    styled: {
      import: "styled",
      from: "goober",
    },
    css: {
      import: "css",
      from: "goober",
    },
    global: {
      import: "glob",
      from: "goober",
    },
  },
};

var getCssConfig = function (config) {
  var usedConfig = userPresets[config.preset] || (config.css && config) || userPresets.emotion;

  if (typeof usedConfig.css === "string") {
    return {
      import: "css",
      from: usedConfig.css,
    };
  }

  return usedConfig.css;
};

var updateCssReferences = function (references, state) {
  if (isEmpty(references)) {
    return;
  }
  if (state.existingCssIdentifier) {
    return;
  }
  references.forEach(function (path$$1) {
    path$$1.node.name = state.cssIdentifier.name;
  });
};

var addCssImport = function (ref) {
  var program = ref.program;
  var t = ref.t;
  var cssImport = ref.cssImport;
  var state = ref.state;

  return addImport({
    types: t,
    program: program,
    name: cssImport.import,
    mod: cssImport.from,
    identifier: state.cssIdentifier,
  });
};
/**
 * Auto add the styled-components css prop
 *
 * When using styled-components, the css prop isn't
 * added until you've imported the macro: "import 'styled-components/macro'".
 * This code aims to automate that import.
 */

var maybeAddCssProperty = function (ref) {
  var program = ref.program;
  var t = ref.t;

  var shouldAddImport = true;
  var twinImportPath;
  var styledComponentsMacroImport = "styled-components/macro"; // Search for a styled-components import
  // TODO: Merge this traversal into ImportDeclaration traversal for perf

  program.traverse({
    ImportDeclaration: function ImportDeclaration(path$$1) {
      // Find the twin import path
      if (path$$1.node.source.value === "twin.macro") {
        twinImportPath = path$$1;
      } // If there's an existing macro import

      if (path$$1.node.source.value === styledComponentsMacroImport) {
        shouldAddImport = false;
      }
    },
  });
  if (!shouldAddImport) {
    return;
  }
  /**
   * Import styled-components/macro AFTER the twin import
   * https://github.com/ben-rogerson/twin.macro/issues/68
   */

  twinImportPath.insertAfter(
    t.importDeclaration(
      [t.importDefaultSpecifier(generateUid("cssPropImport", program))],
      t.stringLiteral(styledComponentsMacroImport)
    )
  );
};

var getStyledConfig = function (config) {
  var usedConfig = userPresets[config.preset] || (config.styled && config) || userPresets.emotion;

  if (typeof usedConfig.styled === "string") {
    return {
      import: "default",
      from: usedConfig.styled,
    };
  }

  return usedConfig.styled;
};

var updateStyledReferences = function (references, state) {
  if (isEmpty(references)) {
    return;
  }
  if (state.existingStyledIdentifier) {
    return;
  }
  references.forEach(function (path$$1) {
    path$$1.node.name = state.styledIdentifier.name;
  });
};

var addStyledImport = function (ref) {
  var program = ref.program;
  var t = ref.t;
  var styledImport = ref.styledImport;
  var state = ref.state;

  return addImport({
    types: t,
    program: program,
    name: styledImport.import,
    mod: styledImport.from,
    identifier: state.styledIdentifier,
  });
};

var getFunctionValue = function (path$$1) {
  if (path$$1.parent.type !== "CallExpression") {
    return;
  }
  var parent = path$$1.findParent(function (x) {
    return x.isCallExpression();
  });
  if (!parent) {
    return;
  }
  var argument = parent.get("arguments")[0] || "";
  return {
    parent: parent,
    input: argument.evaluate && argument.evaluate().value,
  };
};

var getTaggedTemplateValue = function (path$$1) {
  if (path$$1.parent.type !== "TaggedTemplateExpression") {
    return;
  }
  var parent = path$$1.findParent(function (x) {
    return x.isTaggedTemplateExpression();
  });
  if (!parent) {
    return;
  }
  if (parent.node.tag.type !== "Identifier") {
    return;
  }
  return {
    parent: parent,
    input: parent.get("quasi").evaluate().value,
  };
};

var trimInput = function (themeValue) {
  var arrayValues = themeValue.split(".").filter(Boolean);

  if (arrayValues.length === 1) {
    return arrayValues[0];
  }

  return arrayValues.slice(0, -1).join(".");
};

var handleThemeFunction = function (ref) {
  var references = ref.references;
  var t = ref.t;
  var state = ref.state;

  if (!references.theme) {
    return;
  }
  var theme = getTheme(state.config.theme);
  references.theme.forEach(function (path$$1) {
    var ref = getTaggedTemplateValue(path$$1) || getFunctionValue(path$$1) || "";
    var input = ref.input;
    var parent = ref.parent;
    throwIf(!parent, function () {
      return logGeneralError(
        "The theme value doesn’t look right\n\nTry using it like this: theme`colors.black` or theme('colors.black')"
      );
    });
    var themeValue = theme(input);
    throwIf(!themeValue, function () {
      return themeErrorNotFound({
        theme: input.includes(".") ? dlv(theme(), trimInput(input)) : theme(),
        input: input,
        trimInput: trimInput(input),
      });
    });
    return replaceWithLocation(parent, astify(themeValue, t));
  });
};

var getGlobalStylesConfig = function (config) {
  var usedConfig = userPresets[config.preset] || (config.global && config) || userPresets.emotion;
  return usedConfig.global;
};

var addGlobalStylesImport = function (ref) {
  var program = ref.program;
  var t = ref.t;
  var identifier = ref.identifier;
  var config = ref.config;

  var globalStyleConfig = getGlobalStylesConfig(config);
  return addImport({
    types: t,
    program: program,
    identifier: identifier,
    name: globalStyleConfig.import,
    mod: globalStyleConfig.from,
  });
};

var addGlobalCssImport = function (ref) {
  var identifier = ref.identifier;
  var t = ref.t;
  var program = ref.program;

  return addImport({
    types: t,
    program: program,
    mod: "tailwindcss/dist/base.min.css",
    identifier: identifier,
  });
};

var generateTaggedTemplateExpression = function (ref) {
  var identifier = ref.identifier;
  var t = ref.t;
  var keyframes = ref.keyframes;

  var backtickStyles = t.templateElement({
    raw: "" + keyframes,
    cooked: "" + keyframes,
  });
  var ttExpression = t.taggedTemplateExpression(
    identifier,
    t.templateLiteral([backtickStyles], [])
  );
  return ttExpression;
};

var getGlobalDeclarationTte = function (ref) {
  var t = ref.t;
  var stylesUid = ref.stylesUid;
  var globalUid = ref.globalUid;
  var keyframes = ref.keyframes;

  return t.variableDeclaration("const", [
    t.variableDeclarator(
      globalUid,
      generateTaggedTemplateExpression({
        t: t,
        identifier: stylesUid,
        keyframes: keyframes,
      })
    ),
  ]);
};

var getGlobalTte = function (ref) {
  var t = ref.t;
  var stylesUid = ref.stylesUid;
  var keyframes = ref.keyframes;

  return generateTaggedTemplateExpression({
    t: t,
    identifier: stylesUid,
    keyframes: keyframes,
  });
};

var getGlobalDeclarationProperty = function (ref) {
  var t = ref.t;
  var stylesUid = ref.stylesUid;
  var globalUid = ref.globalUid;
  var state = ref.state;
  var keyframes = ref.keyframes;

  var ttExpression = generateTaggedTemplateExpression({
    t: t,
    identifier: state.cssIdentifier,
    keyframes: keyframes,
  });
  var openingElement = t.jsxOpeningElement(
    t.jsxIdentifier(stylesUid.name),
    [t.jsxAttribute(t.jsxIdentifier("styles"), t.jsxExpressionContainer(ttExpression))],
    true
  );
  var closingElement = t.jsxClosingElement(t.jsxIdentifier("close"));
  var arrowFunctionExpression = t.arrowFunctionExpression(
    [],
    t.jsxElement(openingElement, closingElement, [], true)
  );
  var code = t.variableDeclaration("const", [
    t.variableDeclarator(globalUid, arrowFunctionExpression),
  ]);
  return code;
};

var getKeyframesString = function (keyframes) {
  return Object.entries(keyframes)
    .map(function (ref) {
      var name = ref[0];
      var frames = ref[1];

      return (
        "\n      @keyframes " +
        name +
        " {" +
        Object.entries(frames)
          .map(function (ref) {
            var offset = ref[0];
            var styles = ref[1];

            return (
              "\n          " +
              offset +
              " { \n            " +
              Object.entries(styles)
                .map(function (ref) {
                  var key = ref[0];
                  var value = ref[1];

                  return key + ": " + value + ";";
                })
                .join(" ") +
              "\n          }\n        "
            );
          })
          .join("") +
        "}"
      );
    })
    .join("");
};

var handleGlobalStylesFunction = function (ref) {
  var references = ref.references;
  var program = ref.program;
  var t = ref.t;
  var state = ref.state;
  var config = ref.config;

  if (!references.GlobalStyles) {
    return;
  }
  if (references.GlobalStyles.length === 0) {
    return;
  }
  throwIf(references.GlobalStyles.length > 1, function () {
    return logGeneralError("Only one GlobalStyles import can be used");
  });
  var path$$1 = references.GlobalStyles[0];
  var parentPath = path$$1.findParent(function (x) {
    return x.isJSXElement();
  });
  throwIf(state.isStyledComponents && !parentPath, function () {
    return logGeneralError("GlobalStyles must be added as a JSX element, eg: <GlobalStyles />");
  });
  var themeKeyframes = state.config.theme.keyframes || {};
  var keyframes = getKeyframesString(themeKeyframes);
  var globalUid = generateUid("GlobalStyles", program);
  var stylesUid = generateUid("globalImport", program);

  if (state.isStyledComponents) {
    var declaration = getGlobalDeclarationTte({
      t: t,
      globalUid: globalUid,
      stylesUid: stylesUid,
      keyframes: keyframes,
    });
    program.unshiftContainer("body", declaration);
    path$$1.replaceWith(t.jSXIdentifier(globalUid.name));
  }

  if (state.isEmotion) {
    var declaration$1 = getGlobalDeclarationProperty({
      t: t,
      globalUid: globalUid,
      stylesUid: stylesUid,
      state: state,
      keyframes: keyframes,
    });
    program.unshiftContainer("body", declaration$1);
    path$$1.replaceWith(t.jSXIdentifier(globalUid.name));
    state.isImportingCss = true;
  }

  if (state.isGoober) {
    var declaration$2 = getGlobalTte({
      t: t,
      stylesUid: stylesUid,
      keyframes: keyframes,
    });
    program.unshiftContainer("body", declaration$2);
    parentPath.remove();
  }

  var baseCssIdentifier = generateUid("baseCss", program);
  addGlobalCssImport({
    identifier: baseCssIdentifier,
    t: t,
    program: program,
  });
  addGlobalStylesImport({
    identifier: stylesUid,
    t: t,
    program: program,
    config: config,
  });
};

var addDebugPropToPath = function (ref) {
  var t = ref.t;
  var attributes = ref.attributes;
  var rawClasses = ref.rawClasses;
  var path$$1 = ref.path;
  var state = ref.state;

  if (state.isProd || !state.debugProp) {
    return;
  } // Remove the existing debug attribute if you happen to have it

  var debugProperty = attributes.filter(function (p) {
    return p.node && p.node.name && p.node.name.name === "data-tw";
  });
  debugProperty.forEach(function (path$$1) {
    return path$$1.remove();
  }); // Add the attribute

  path$$1.insertAfter(t.jsxAttribute(t.jsxIdentifier("data-tw"), t.stringLiteral(rawClasses)));
};

var addDebugPropToExistingPath = function (ref) {
  var t = ref.t;
  var attributes = ref.attributes;
  var rawClasses = ref.rawClasses;
  var path$$1 = ref.path;
  var state = ref.state;

  if (state.isProd || !state.debugProp) {
    return;
  } // Append to the existing debug attribute

  var debugProperty = attributes.find(
    // TODO: Use @babel/plugin-proposal-optional-chaining
    function (p) {
      return p.node && p.node.name && p.node.name.name === "data-tw";
    }
  );

  if (debugProperty) {
    try {
      // Existing data-tw
      if (debugProperty.node.value.value) {
        debugProperty.node.value.value = debugProperty.node.value.value + " | " + rawClasses;
        return;
      } // New data-tw

      debugProperty.node.value.expression.value =
        debugProperty.node.value.expression.value + " | " + rawClasses;
    } catch (_) {}

    return;
  } // Add a new attribute

  path$$1.pushContainer(
    "attributes",
    t.jSXAttribute(
      t.jSXIdentifier("data-tw"),
      t.jSXExpressionContainer(t.stringLiteral(rawClasses))
    )
  );
};

var stringifyScreen = function (config, screenName) {
  var screen = dlv(config, ["theme", "screens", screenName]);

  if (typeof screen === "undefined") {
    throw new Error(
      'Couldn’t find Tailwind the screen "' + screenName + '" in the Tailwind config'
    );
  }

  if (typeof screen === "string") {
    return "@media (min-width: " + screen + ")";
  }

  if (typeof screen.raw === "string") {
    return "@media " + screen.raw;
  }

  var string = (Array.isArray(screen) ? screen : [screen])
    .map(function (range) {
      return [
        typeof range.min === "string" ? "(min-width: " + range.min + ")" : null,
        typeof range.max === "string" ? "(max-width: " + range.max + ")" : null,
      ]
        .filter(Boolean)
        .join(" and ");
    })
    .join(", ");
  return string ? "@media " + string : "";
};

var orderByScreens = function (className, state) {
  var classNames = className.match(/\S+/g) || [];
  var screens = Object.keys(state.config.theme.screens);

  var screenCompare = function (a, b) {
    var A = a.includes(":") ? a.split(":")[0] : a;
    var B = b.includes(":") ? b.split(":")[0] : b;
    return screens.indexOf(A) < screens.indexOf(B) ? -1 : 1;
  }; // Tim Sort provides accurate sorting in node < 11
  // https://github.com/ben-rogerson/twin.macro/issues/20

  timSort(classNames, screenCompare);
  return classNames;
};

function objectWithoutProperties$1(obj, exclude) {
  var target = {};
  for (var k in obj)
    if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1)
      target[k] = obj[k];
  return target;
}
/**
 * Validate variants against the variants config key
 */

var validateVariants = function (ref) {
  var variants = ref.variants;
  var state = ref.state;
  var rest$1 = objectWithoutProperties$1(ref, ["variants", "state"]);
  var rest = rest$1;

  if (!variants) {
    return [];
  }
  var screens = dlv(state.config, ["theme", "screens"]);
  var screenNames = Object.keys(screens);
  return variants
    .map(function (variant) {
      var isResponsive = screenNames && screenNames.includes(variant);

      if (isResponsive) {
        return stringifyScreen(state.config, variant);
      }

      if (variantConfig[variant]) {
        var foundVariant = variantConfig[variant];

        if (typeof foundVariant === "function") {
          var context = Object.assign({}, rest, {
            config: function (item) {
              return state.config[item] || null;
            },
            errorCustom: function (message) {
              throw new MacroError(logGeneralError(message));
            },
          });
          foundVariant = foundVariant(context);
        }

        if (state.configTwin.sassyPseudo) {
          return foundVariant.replace(/(?<= ):|^:/g, "&:");
        }

        return foundVariant;
      }

      var validVariants = Object.assign(
        {},
        screenNames.length > 0 && {
          "Screen breakpoints": screenNames,
        },
        { "Built-in variants": Object.keys(variantConfig) }
      );
      throw new MacroError(logNoVariant(variant, validVariants));
    })
    .filter(Boolean);
};
/**
 * Split the variant(s) from the className
 */

var splitVariants = function (ref) {
  var classNameRaw = ref.classNameRaw;
  var state = ref.state;

  var variantsList = [];
  var variant;
  var className = classNameRaw;

  while (variant !== null) {
    variant = className.match(/^([_a-z-]+):/);

    if (variant) {
      className = className.slice(variant[0].length);
      variantsList.push(variant[1]);
    }
  } // dark: and light: variants

  var hasDarkVariant = variantsList.some(function (v) {
    return v === "dark";
  });
  var hasLightVariant = variantsList.some(function (v) {
    return v === "light";
  });

  if (hasDarkVariant && hasLightVariant) {
    throw new MacroError(
      logGeneralError("The light: and dark: variants can’t be used on the same element")
    );
  }

  var hasGroupVariant = variantsList.some(function (v) {
    return v.startsWith("group-");
  }); // Match the filtered variants

  var variants = validateVariants({
    variants: variantsList,
    state: state,
    hasDarkVariant: hasDarkVariant,
    hasLightVariant: hasLightVariant,
    hasGroupVariant: hasGroupVariant,
  });
  var hasVariants = variants.length > 0;
  return {
    classNameRawNoVariants: className,
    className: className,
    variants: variants,
    hasVariants: hasVariants,
  };
};

var addVariants = function (ref) {
  var results = ref.results;
  var style = ref.style;
  var pieces = ref.pieces;

  var variants = pieces.variants;
  if (variants.length === 0) {
    return;
  }
  var styleWithVariants = cleanSet(
    results,
    variants,
    Object.assign({}, dlv(styleWithVariants, variants, {}), style)
  );
  return styleWithVariants;
};

var handleVariantGroups = function (classes) {
  var groupedMatches = classes.match(/(\S*):\(([^\n\r()]*)\)/g);
  if (!groupedMatches) {
    return classes;
  }
  var newClasses = classes.slice();
  groupedMatches.forEach(function (group) {
    var match = group.match(/(\S*):\(([^\n\r()]*)\)/);
    if (!match) {
      return "";
    }
    var variant = match[1];
    var unwrappedClasses = match[2];
    var wrapped = unwrappedClasses
      .trim()
      .split(" ")
      .filter(Boolean) // remove double spaces '  '
      .map(function (unwrappedClass) {
        return variant + ":" + unwrappedClass;
      })
      .join(" ");
    newClasses = newClasses.replace(group, wrapped);
  });
  return newClasses;
};

/**
 * Add important to a value
 * Only used for static and dynamic styles - not core plugins
 */

var mergeImportant = function (style, hasImportant) {
  if (!hasImportant) {
    return style;
  }
  return Object.entries(style).reduce(function (accumulator, item) {
    var obj;

    var key = item[0];
    var value = item[1];

    if (typeof value === "object") {
      return mergeImportant(value, hasImportant);
    }

    return deepMerge(accumulator, ((obj = {}), (obj[key] = value + " !important"), obj));
  }, {});
};
/**
 * Split the important from the className
 */

var splitImportant = function (ref) {
  var className = ref.className;

  var lastCharacter = className.slice(-1);
  var hasImportant = lastCharacter === "!";

  if (hasImportant) {
    className = className.slice(0, -1);
  }

  var important = hasImportant ? " !important" : "";
  return {
    className: className,
    hasImportant: hasImportant,
    important: important,
  };
};

/**
 * Split the negative from the className
 */
var splitNegative = function (ref) {
  var className = ref.className;

  var hasNegative = className.slice(0, 1) === "-";

  if (hasNegative) {
    className = className.slice(1, className.length);
  }

  var negative = hasNegative ? "-" : "";
  return {
    className: className,
    hasNegative: hasNegative,
    negative: negative,
  };
};

var splitters = [splitVariants, splitNegative, splitImportant];
var getPieces = function (context) {
  var results = splitters.reduce(function (results, splitter) {
    return Object.assign({}, results, splitter(results));
  }, context);
  delete results.state;
  return results;
};

var precheckGroup = function (ref) {
  var classNameRaw = ref.classNameRaw;

  return throwIf(classNameRaw === "group", function () {
    return (
      '"group" must be added as className:\n\n' +
      logBadGood("tw`group`", '<div className="group">') +
      "\n"
    );
  });
};

var doPrechecks = function (prechecks, context) {
  for (var i = 0, list = prechecks; i < list.length; i += 1) {
    var precheck = list[i];

    precheck(context);
  }
};

var transformImportant = function (ref) {
  var style = ref.style;
  var hasImportant = ref.pieces.hasImportant;

  return mergeImportant(style, hasImportant);
};

var applyTransforms = function (context) {
  var style = context.style;
  var type = context.type;
  if (!style) {
    return;
  }
  var result = context.style;
  if (type !== "corePlugin") {
    result = transformImportant(context);
  }
  return result;
};

var matchKeys = function (values, className, sassyPseudo) {
  return values.reduce(function (result, data) {
    var obj;

    var key = data[0];
    var value = data[1];
    var newKey = formatKey(key, className, sassyPseudo);
    var newValue =
      typeof value === "object" &&
      (key === className || key.startsWith(className + ":") || key.startsWith(className + " ")) &&
      (newKey ? ((obj = {}), (obj[newKey] = value), obj) : value);
    return Object.assign({}, result, newValue);
  }, {});
};

var reorderAtRules = function (className) {
  return Object.entries(className)
    .sort(function (a, b) {
      var aKey = a[0];
      var bKey = b[0];
      var A = aKey.startsWith("@") ? 1 : 0;
      var B = bKey.startsWith("@") ? 1 : 0;
      return B > A ? -1 : 0;
    })
    .reduce(function (r, ref) {
      var obj;

      var k = ref[0];
      var v = ref[1];
      return Object.assign({}, r, ((obj = {}), (obj[k] = v), obj));
    }, {});
};

var getComponentMatches = function (ref) {
  var className = ref.className;
  var components = ref.components;
  var sassyPseudo = ref.sassyPseudo;

  return Object.entries(components).reduce(function (result, data) {
    var obj, obj$1;

    var key = data[0];
    var value = data[1];
    var subKeyMatch = matchKeys(Object.entries(value), className, sassyPseudo);
    var newKey = formatKey(key, className, sassyPseudo);

    if (!isEmpty(subKeyMatch)) {
      return Object.assign({}, result, ((obj = {}), (obj[newKey] = subKeyMatch), obj));
    }

    if (key === className || key.startsWith(className + ":") || key.startsWith(className + " ")) {
      return newKey
        ? Object.assign({}, result, ((obj$1 = {}), (obj$1[newKey] = value), obj$1))
        : Object.assign({}, result, value);
    }

    return result;
  }, {});
};

var formatKey = function (selector, className, sassyPseudo) {
  var newSelector = selector.replace(className, "").trim();
  return newSelector.startsWith(":") ? "" + (sassyPseudo ? "&" : "") + newSelector : newSelector;
};

var handleUserPlugins = function (ref) {
  var ref_state = ref.state;
  var sassyPseudo = ref_state.configTwin.sassyPseudo;
  var ref_state_userPluginData = ref_state.userPluginData;
  var components = ref_state_userPluginData.components;
  var utilities = ref_state_userPluginData.utilities;
  var className = ref.className;

  /**
   * Components
   */
  if (components) {
    var componentMatches = getComponentMatches({
      className: className,
      components: components,
      sassyPseudo: sassyPseudo,
    });

    if (!isEmpty(componentMatches)) {
      return reorderAtRules(componentMatches);
    }
  }
  /**
   * Utilities
   */

  if (!utilities) {
    return;
  }
  var output = typeof utilities[className] !== "undefined" ? utilities[className] : null;
  return output;
};

var handleStatic = function (ref) {
  var pieces = ref.pieces;

  var className = pieces.className;
  /**
   * Static styles clone fix
   * Fixes strange merging on the last item in a screen class list
   * Test data: tw`text-center md:text-center sm:text-center`
   */

  var staticStylesFix = JSON.parse(JSON.stringify(staticStyles));
  return dlv(staticStylesFix, [className, "output"]);
};

var normalizeValue = function (value) {
  if (["string", "function"].includes(typeof value) || Array.isArray(value)) {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  logGeneralError(
    'The config value "' +
      Object.stringify(value) +
      '" is unsupported - try a string, function, array, or number'
  );
};

var matchChildKey = function (from, matcher) {
  if (!matcher) {
    return;
  }

  var loop = function () {
    var entry = list[i];

    var key = entry[0];
    var value = entry[1];
    if (typeof value !== "object") {
      return;
    } // Fixes https://github.com/ben-rogerson/twin.macro/issues/104

    if (!matcher.startsWith(key)) {
      return;
    }
    var splitMatcher = matcher.split(key);
    if (isEmpty(splitMatcher[1])) {
      return;
    }
    var match = stripNegative(splitMatcher[1]);
    var objectMatch = value[match];
    if (isEmpty(objectMatch)) {
      return;
    }
    var isValueReturnable =
      typeof objectMatch === "string" ||
      typeof objectMatch === "number" ||
      Array.isArray(objectMatch);
    throwIf(!isValueReturnable, function () {
      return logGeneralError(
        "The tailwind config is nested too deep\nReplace this with a string, number or array:\n" +
          JSON.stringify(objectMatch)
      );
    });
    return { v: String(objectMatch) };
  };

  for (var i = 0, list = Object.entries(from); i < list.length; i += 1) {
    var returned = loop();

    if (returned) return returned.v;
  }
};
/**
 * Searches the tailwindConfig
 * Maximum of two levels deep
 */

var getConfigValue = function (from, matcher) {
  if (!from) {
    return;
  } // Match default value from current object

  if (isEmpty(matcher) && !isEmpty(from.default)) {
    return normalizeValue(from.default);
  }

  var match = from[matcher];

  if (["string", "number", "function"].includes(typeof match) || Array.isArray(match)) {
    return normalizeValue(match);
  } // Match default value from child object

  var defaultMatch = typeof match === "object" && match.default;

  if (defaultMatch) {
    return normalizeValue(defaultMatch);
  }

  var firstChildKey = matchChildKey(from, matcher);
  if (firstChildKey) {
    return firstChildKey;
  }
};

var styleify = function (ref) {
  var obj;

  var property = ref.property;
  var value = ref.value;
  var negative = ref.negative;
  value = Array.isArray(value) ? value.join(", ") : negative ? stripNegative(value) : value;
  return Array.isArray(property)
    ? property.reduce(function (results, item) {
        var obj;

        return Object.assign({}, results, ((obj = {}), (obj[item] = "" + negative + value), obj));
      }, {})
    : ((obj = {}), (obj[property] = "" + negative + value), obj);
};

var handleDynamic = function (ref) {
  var theme = ref.theme;
  var pieces = ref.pieces;
  var state = ref.state;
  var dynamicKey = ref.dynamicKey;
  var dynamicConfig = ref.dynamicConfig;

  var className = pieces.className;
  var negative = pieces.negative;
  var key = "" + negative + className.slice(Number(dynamicKey.length) + 1);

  var grabConfig = function (ref) {
    var config = ref.config;
    var configFallback = ref.configFallback;

    return (config && theme(config)) || (configFallback && theme(configFallback));
  };

  var styleSet = Array.isArray(dynamicConfig) ? dynamicConfig : [dynamicConfig];
  var results = styleSet
    .map(function (item) {
      return {
        property: item.prop,
        value: getConfigValue(grabConfig(item), key),
        negative: negative,
      };
    })
    .filter(function (item) {
      return item.value;
    })[0];
  throwIf(!results || className.endsWith("-"), function () {
    return errorSuggestions({
      pieces: pieces,
      state: state,
      config:
        styleSet.map(function (item) {
          return item.config;
        }) || [],
      dynamicKey: dynamicKey,
    });
  });
  return styleify(results);
};

var animation = function (properties) {
  var theme = properties.theme;
  var match = properties.match;
  var getConfigValue = properties.getConfigValue;
  var errorSuggestions = properties.errors.errorSuggestions;
  var important = properties.pieces.important;
  var classValue = match(/(?<=(animate)-)([^]*)/);

  var configValue = function (config) {
    return getConfigValue(theme(config), classValue);
  };

  var animationConfig = configValue("animation");

  if (!animationConfig) {
    errorSuggestions({
      config: ["animation"],
    });
  }

  return {
    animation: "" + animationConfig + important,
  };
};

var handleColor = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;
  var disableColorVariables = ref.disableColorVariables;

  var value = configValue("backgroundColor");
  if (!value) {
    return;
  }
  return withAlpha({
    color: value,
    property: "backgroundColor",
    variable: !disableColorVariables && "--bg-opacity",
    important: important,
  });
};

var handleSize = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;

  var value = configValue("backgroundSize");
  if (!value) {
    return;
  }
  return {
    backgroundSize: "" + value + important,
  };
};

var handlePosition = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;

  var value = configValue("backgroundPosition");
  if (!value) {
    return;
  }
  return {
    backgroundPosition: "" + value + important,
  };
};

var handleImage = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;

  var value = configValue("backgroundImage");
  if (!value) {
    return;
  }
  return {
    backgroundImage: "" + value + important,
  };
};

var bg = function (properties) {
  var theme = properties.theme;
  var match = properties.match;
  var getConfigValue = properties.getConfigValue;
  var disableColorVariables = properties.configTwin.disableColorVariables;
  var errorSuggestions = properties.errors.errorSuggestions;
  var important = properties.pieces.important;
  var classValue = match(/(?<=(bg)-)([^]*)/);

  var configValue = function (config) {
    return getConfigValue(theme(config), classValue);
  };

  var color = handleColor({
    configValue: configValue,
    important: important,
    disableColorVariables: disableColorVariables,
  });
  if (color) {
    return color;
  }
  var size = handleSize({
    configValue: configValue,
    important: important,
  });
  if (size) {
    return size;
  }
  var position = handlePosition({
    configValue: configValue,
    important: important,
  });
  if (position) {
    return position;
  }
  var image = handleImage({
    configValue: configValue,
    important: important,
  });
  if (image) {
    return image;
  }
  errorSuggestions({
    config: ["backgroundColor", "backgroundSize", "backgroundPosition", "backgroundImage"],
  });
};

var handleWidth = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;

  var value = configValue("borderWidth");
  if (!value) {
    return;
  }
  return {
    borderWidth: "" + value + important,
  };
};

var handleColor$1 = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;
  var disableColorVariables = ref.disableColorVariables;

  var value = configValue("borderColor");
  if (!value) {
    return;
  }
  return withAlpha({
    color: value,
    property: "borderColor",
    variable: !disableColorVariables && "--border-opacity",
    important: important,
  });
};

var border = function (properties) {
  var match = properties.match;
  var theme = properties.theme;
  var getConfigValue = properties.getConfigValue;
  var disableColorVariables = properties.configTwin.disableColorVariables;
  var important = properties.pieces.important;
  var errorSuggestions = properties.errors.errorSuggestions;
  var classValue = match(/(?<=(border-))([^]*)/);

  var configValue = function (config) {
    return getConfigValue(theme(config), classValue);
  };

  var width = handleWidth({
    configValue: configValue,
    important: important,
  });
  if (width) {
    return width;
  }
  var color = handleColor$1({
    configValue: configValue,
    important: important,
    disableColorVariables: disableColorVariables,
  });
  if (color) {
    return color;
  }
  errorSuggestions({
    config: ["borderColor", "borderWidth"],
  });
};

var properties = function (type) {
  return {
    left: type + "Left",
    right: type + "Right",
  };
};

var getSpacingFromArray = function (ref) {
  var obj;

  var values = ref.values;
  var left = ref.left;
  var right = ref.right;
  if (!Array.isArray(values)) {
    return;
  }
  var valueLeft = values[0];
  var valueRight = values[1];
  return (obj = {}), (obj[left] = valueLeft), (obj[right] = valueRight), obj;
};

var getSpacingStyle = function (type, values, key) {
  var obj;

  if (Array.isArray(values) || typeof values !== "object") {
    return;
  }
  var propertyValue = values[key] || {};
  if (isEmpty(propertyValue)) {
    return;
  }
  var objectArraySpacing = getSpacingFromArray(
    Object.assign({}, { values: propertyValue }, properties(type))
  );
  if (objectArraySpacing) {
    return objectArraySpacing;
  }
  return (
    (obj = {}),
    (obj[properties(type).left] = propertyValue),
    (obj[properties(type).right] = propertyValue),
    obj
  );
};

var container = function (ref) {
  var ref_pieces = ref.pieces;
  var hasVariants = ref_pieces.hasVariants;
  var hasImportant = ref_pieces.hasImportant;
  var hasNegative = ref_pieces.hasNegative;
  var ref_errors = ref.errors;
  var errorNoVariants = ref_errors.errorNoVariants;
  var errorNoImportant = ref_errors.errorNoImportant;
  var errorNoNegatives = ref_errors.errorNoNegatives;
  var theme = ref.theme;

  hasVariants && errorNoVariants();
  hasImportant && errorNoImportant();
  hasNegative && errorNoNegatives();
  var ref$1 = theme();
  var container = ref$1.container;
  var screensRaw = ref$1.screens;
  var padding = container.padding;
  var margin = container.margin;
  var center = container.center;
  var screens = container.screens || screensRaw;
  var mediaScreens = Object.entries(screens).reduce(function (accumulator, ref) {
    var obj;

    var key = ref[0];
    var rawValue = ref[1];
    var value = typeof rawValue === "object" ? rawValue.min || rawValue["min-width"] : rawValue;
    return Object.assign(
      {},
      accumulator,
      ((obj = {}),
      (obj["@media (min-width: " + value + ")"] = Object.assign(
        {},
        { maxWidth: value },
        padding && getSpacingStyle("padding", padding, key),
        !center && margin && getSpacingStyle("margin", margin, key)
      )),
      obj)
    );
  }, {});
  var paddingStyles = Array.isArray(padding)
    ? getSpacingFromArray(Object.assign({}, { values: padding }, properties("padding")))
    : typeof padding === "object"
    ? getSpacingStyle("padding", padding, "default")
    : {
        paddingLeft: padding,
        paddingRight: padding,
      };
  var marginStyles = Array.isArray(margin)
    ? getSpacingFromArray(Object.assign({}, { values: margin }, properties("margin")))
    : typeof margin === "object"
    ? getSpacingStyle("margin", margin, "default")
    : {
        marginLeft: margin,
        marginRight: margin,
      }; // { center: true } overrides any margin styles

  if (center) {
    marginStyles = {
      marginLeft: "auto",
      marginRight: "auto",
    };
  }
  return Object.assign({}, { width: "100%" }, paddingStyles, marginStyles, mediaScreens);
};

var handleColor$2 = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;
  var disableColorVariables = ref.disableColorVariables;

  var value = configValue("divideColor") || configValue("borderColor") || configValue("colors");
  if (!value) {
    return;
  }
  var borderColor = withAlpha({
    color: value,
    property: "borderColor",
    variable: !disableColorVariables && "--divide-opacity",
    important: important,
  });
  return {
    "> :not(template) ~ :not(template)": borderColor,
  };
};

var handleOpacity = function (ref) {
  var configValue = ref.configValue;

  var opacity = configValue("divideOpacity") || configValue("opacity");
  if (!opacity) {
    return;
  }
  return {
    "> :not(template) ~ :not(template)": {
      "--divide-opacity": "" + opacity,
    },
  };
};

var handleWidth$1 = function (ref) {
  var obj;

  var configValue = ref.configValue;
  var ref_pieces = ref.pieces;
  var negative = ref_pieces.negative;
  var className = ref_pieces.className;
  var important = ref_pieces.important;
  var width = configValue("divideWidth");
  if (!width) {
    return;
  }
  var value = "" + negative + addPxTo0(width);
  var isDivideX = className.startsWith("divide-x");
  var cssVariableKey = isDivideX ? "--divide-x-reverse" : "--divide-y-reverse";
  var borderFirst = "calc(" + value + " * var(" + cssVariableKey + "))" + important;
  var borderSecond = "calc(" + value + " * calc(1 - var(" + cssVariableKey + ")))" + important;
  var styleKey = isDivideX
    ? {
        borderRightWidth: borderFirst,
        borderLeftWidth: borderSecond,
      }
    : {
        borderTopWidth: borderSecond,
        borderBottomWidth: borderFirst,
      };
  var innerStyles = Object.assign(((obj = {}), (obj[cssVariableKey] = 0), obj), styleKey);
  return {
    "> :not(template) ~ :not(template)": innerStyles,
  };
};

var divide = function (properties) {
  var important = properties.pieces.important;
  var errorSuggestions = properties.errors.errorSuggestions;
  var disableColorVariables = properties.configTwin.disableColorVariables;
  var getConfigValue = properties.getConfigValue;
  var theme = properties.theme;
  var match = properties.match;
  var classValue = match(/(?<=(divide-))([^]*)/);

  var configValue = function (config) {
    return getConfigValue(theme(config), classValue);
  };

  var color = handleColor$2({
    configValue: configValue,
    important: important,
    disableColorVariables: disableColorVariables,
  });
  if (color) {
    return color;
  }
  var opacityMatch =
    match(/(?<=(divide)-(opacity))([^]*)/) || (match(/^divide-opacity$/) && "default");

  if (opacityMatch) {
    var opacityValue = stripNegative(opacityMatch) || "";
    var opacityProperties = Object.assign(
      {},
      {
        configValue: function (config) {
          return getConfigValue(theme(config), opacityValue);
        },
      },
      properties
    );
    var opacity = handleOpacity(opacityProperties);
    if (opacity) {
      return opacity;
    }
    errorSuggestions({
      config: theme("divideOpacity") ? "divideOpacity" : "opacity",
    });
  }

  var widthMatch = match(/(?<=(divide)-(x|y))([^]*)/) || (match(/^divide-(x|y)$/) && "default");

  if (widthMatch) {
    var widthValue = stripNegative(widthMatch) || "";
    var widthProperties = Object.assign(
      {},
      {
        configValue: function (config) {
          return getConfigValue(theme(config), widthValue);
        },
      },
      properties
    );
    var width = handleWidth$1(widthProperties);
    if (width) {
      return width;
    }
    errorSuggestions({
      config: "divideWidth",
    });
  }

  errorSuggestions();
};

var transparentTo = function (value) {
  if (typeof value === "function") {
    return value({
      opacityValue: 0,
    });
  }

  try {
    var ref = toRgba(value);
    var r = ref[0];
    var g = ref[1];
    var b = ref[2];
    return "rgba(" + r + ", " + g + ", " + b + ", 0)";
  } catch (_) {
    return "rgba(255, 255, 255, 0)";
  }
};

var gradient = function (properties) {
  var match = properties.match;
  var theme = properties.theme;
  var getConfigValue = properties.getConfigValue;
  var properties_pieces = properties.pieces;
  var hasNegative = properties_pieces.hasNegative;
  var hasImportant = properties_pieces.hasImportant;
  var className = properties_pieces.className;
  var properties_errors = properties.errors;
  var errorNoNegatives = properties_errors.errorNoNegatives;
  var errorNoImportant = properties_errors.errorNoImportant;
  var errorSuggestions = properties_errors.errorSuggestions;
  var classValue = match(/(?<=(from-|via-|to-))([^]*)/);

  var configValue = function (config) {
    return getConfigValue(theme(config), classValue);
  };

  if (!configValue) {
    return;
  }
  var value = configValue("gradientColorStops");
  !value &&
    errorSuggestions({
      config: "gradientColorStops",
    });

  var getColorValue = function (color) {
    return typeof color === "function" ? value({}) : color;
  };

  var styleDefinitions = {
    from: {
      "--gradient-from-color": getColorValue(value, "from"),
      "--gradient-color-stops":
        "var(--gradient-from-color), var(--gradient-to-color, " + transparentTo(value) + ")",
    },
    via: {
      "--gradient-via-color": getColorValue(value, "via"),
      "--gradient-color-stops":
        "var(--gradient-from-color), var(--gradient-via-color), var(--gradient-to-color, " +
        transparentTo(value) +
        ")",
    },
    to: {
      "--gradient-to-color": getColorValue(value, "to"),
    },
  };
  var ref =
    Object.entries(styleDefinitions).find(function (ref) {
      var k = ref[0];

      return className.startsWith(k + "-");
    }) || [];
  var styles = ref[1];
  !styles &&
    errorSuggestions({
      config: "gradientColorStops",
    });
  hasNegative && errorNoNegatives();
  hasImportant && errorNoImportant();
  return styles;
};

var outline = function (properties) {
  var theme = properties.theme;
  var match = properties.match;
  var getConfigValue = properties.getConfigValue;
  var errorSuggestions = properties.errors.errorSuggestions;
  var important = properties.pieces.important;
  var classValue = match(/(?<=(outline)-)([^]*)/);

  var configValue = function (config) {
    return getConfigValue(theme(config), classValue);
  };

  var value = configValue("outline");

  if (!value) {
    errorSuggestions({
      config: ["outline"],
    });
  }

  var ref = Array.isArray(value) ? value : [value];
  var outline = ref[0];
  var outlineOffset = ref[1];
  if (outlineOffset === void 0) outlineOffset = 0;
  return Object.assign(
    {},
    { outline: "" + outline + important },
    outlineOffset && {
      outlineOffset: "" + outlineOffset + important,
    }
  );
};

var handleColor$3 = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;
  var disableColorVariables = ref.disableColorVariables;

  var value = configValue("placeholderColor");
  if (!value) {
    return;
  }
  return withAlpha({
    color: value,
    property: "color",
    variable: !disableColorVariables && "--placeholder-opacity",
    important: important,
  });
};

var handleOpacity$1 = function (ref) {
  var configValue = ref.configValue;

  var value = configValue("placeholderOpacity") || configValue("opacity");
  if (!value) {
    return;
  }
  return {
    "--placeholder-opacity": "" + value,
  };
};

var placeholder = function (properties) {
  var match = properties.match;
  var theme = properties.theme;
  var getConfigValue = properties.getConfigValue;
  var disableColorVariables = properties.configTwin.disableColorVariables;
  var important = properties.pieces.important;
  var errorSuggestions = properties.errors.errorSuggestions;
  var opacityMatch = match(/(?<=(placeholder-opacity-))([^]*)/) || match(/^placeholder-opacity$/);
  var opacity = handleOpacity$1({
    configValue: function (config) {
      return getConfigValue(theme(config), opacityMatch);
    },
  });
  if (opacity) {
    return {
      "::placeholder": opacity,
    };
  }
  var colorMatch = match(/(?<=(placeholder-))([^]*)/);
  var color = handleColor$3({
    configValue: function (config) {
      return getConfigValue(theme(config), colorMatch);
    },
    important: important,
    disableColorVariables: disableColorVariables,
  });
  if (color) {
    return {
      "::placeholder": color,
    };
  }
  errorSuggestions({
    config: ["placeholderColor", theme("placeholderOpacity") ? "placeholderOpacity" : "opacity"],
  });
};

var space = function (ref) {
  var obj;

  var ref_pieces = ref.pieces;
  var negative = ref_pieces.negative;
  var important = ref_pieces.important;
  var className = ref_pieces.className;
  var errorSuggestions = ref.errors.errorSuggestions;
  var theme = ref.theme;
  var match = ref.match;
  var classNameValue =
    match(/(?<=(space)-(x|y)-)([^]*)/) || match(/^space-x$/) || match(/^space-y$/);
  var spaces = theme("space");
  var configValue = spaces[classNameValue || "default"];
  !configValue &&
    errorSuggestions({
      config: ["space"],
    });
  var value = "" + negative + addPxTo0(configValue);
  var isSpaceX = className.startsWith("space-x-"); // 🚀

  var cssVariableKey = isSpaceX ? "--space-x-reverse" : "--space-y-reverse";
  var marginFirst = "calc(" + value + " * var(" + cssVariableKey + "))" + important;
  var marginSecond = "calc(" + value + " * calc(1 - var(" + cssVariableKey + ")))" + important;
  var styleKey = isSpaceX
    ? {
        marginRight: marginFirst,
        marginLeft: marginSecond,
      }
    : {
        marginTop: marginSecond,
        marginBottom: marginFirst,
      };
  var innerStyles = Object.assign(((obj = {}), (obj[cssVariableKey] = 0), obj), styleKey);
  return {
    "> :not(template) ~ :not(template)": innerStyles,
  };
};

var handleColor$4 = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;

  var value = configValue("stroke");
  if (!value) {
    return;
  }
  return {
    stroke: "" + value + important,
  };
};

var handleWidth$2 = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;

  var value = configValue("strokeWidth");
  if (!value) {
    return;
  }
  return {
    strokeWidth: "" + value + important,
  };
};

var handleCustom = function (ref) {
  var classValue = ref.classValue;
  var important = ref.important;

  if (classValue !== "non-scaling") {
    return;
  }
  return {
    vectorEffect: "non-scaling-stroke" + important,
  };
};

var stroke = function (properties) {
  var theme = properties.theme;
  var match = properties.match;
  var getConfigValue = properties.getConfigValue;
  var errorSuggestions = properties.errors.errorSuggestions;
  var important = properties.pieces.important;
  var classValue = match(/(?<=(stroke)-)([^]*)/);

  var configValue = function (config) {
    return getConfigValue(theme(config), classValue);
  };

  var color = handleColor$4({
    configValue: configValue,
    important: important,
  });
  if (color) {
    return color;
  }
  var width = handleWidth$2({
    configValue: configValue,
    important: important,
  });
  if (width) {
    return width;
  }
  var custom = handleCustom({
    classValue: classValue,
    important: important,
  });
  if (custom) {
    return custom;
  }
  errorSuggestions({
    config: ["stroke", "strokeWidth"],
  });
};

var handleColor$5 = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;
  var disableColorVariables = ref.disableColorVariables;

  var value = configValue("textColor");
  if (!value) {
    return;
  }
  return withAlpha({
    color: value,
    property: "color",
    variable: !disableColorVariables && "--text-opacity",
    important: important,
  });
};

var handleSize$1 = function (ref) {
  var configValue = ref.configValue;
  var important = ref.important;

  var value = configValue("fontSize");
  if (!value) {
    return;
  }
  var ref$1 = Array.isArray(value) ? value : [value];
  var fontSize = ref$1[0];
  var options = ref$1[1];
  var lineHeight = options instanceof Object ? options.lineHeight : options;
  var letterSpacing = options && options.letterSpacing;
  return Object.assign(
    {},
    { fontSize: "" + fontSize + important },
    lineHeight && {
      lineHeight: "" + lineHeight + important,
    },
    letterSpacing && {
      letterSpacing: "" + letterSpacing + important,
    }
  );
};

var text = function (properties) {
  var match = properties.match;
  var theme = properties.theme;
  var getConfigValue = properties.getConfigValue;
  var disableColorVariables = properties.configTwin.disableColorVariables;
  var properties_pieces = properties.pieces;
  var important = properties_pieces.important;
  var hasNegative = properties_pieces.hasNegative;
  var properties_errors = properties.errors;
  var errorSuggestions = properties_errors.errorSuggestions;
  var errorNoNegatives = properties_errors.errorNoNegatives;
  hasNegative && errorNoNegatives();
  var classValue = match(/(?<=(text-))([^]*)/);

  var configValue = function (config) {
    return getConfigValue(theme(config), classValue);
  };

  var color = handleColor$5({
    configValue: configValue,
    important: important,
    disableColorVariables: disableColorVariables,
  });
  if (color) {
    return color;
  }
  var size = handleSize$1({
    configValue: configValue,
    important: important,
  });
  if (size) {
    return size;
  }
  errorSuggestions({
    config: ["textColor", "fontSize"],
  });
};

var plugins = {
  animation: animation,
  bg: bg,
  border: border,
  container: container,
  divide: divide,
  gradient: gradient,
  outline: outline,
  placeholder: placeholder,
  space: space,
  stroke: stroke,
  text: text,
};

function objectWithoutProperties$2(obj, exclude) {
  var target = {};
  for (var k in obj)
    if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1)
      target[k] = obj[k];
  return target;
}

var getErrors = function (ref) {
  var pieces = ref.pieces;
  var state = ref.state;
  var dynamicKey = ref.dynamicKey;

  var className = pieces.className;
  var variants = pieces.variants;
  return {
    errorSuggestions: function (options) {
      throw new MacroError(
        errorSuggestions(
          Object.assign({}, { pieces: pieces, state: state, dynamicKey: dynamicKey }, options)
        )
      );
    },
    errorNoVariants: function () {
      throw new MacroError(
        logNotAllowed({
          className: className,
          error:
            "doesn’t support " +
            variants
              .map(function (variant) {
                return variant + ":";
              })
              .join("") +
            " or any other variants",
        })
      );
    },
    errorNoImportant: function () {
      throw new MacroError(
        logNotAllowed({
          className: className,
          error: "doesn’t support !important",
        })
      );
    },
    errorNoNegatives: function () {
      throw new MacroError(
        logNotAllowed({
          className: className,
          error: "doesn’t support negatives",
        })
      );
    },
  };
};

var callPlugin = function (corePlugin, context) {
  var handle = plugins[corePlugin] || null;

  if (!handle) {
    throw new MacroError('No handler specified, looked for "' + corePlugin + '"');
  }

  return handle(context);
};

var handleCorePlugins = function (ref) {
  var corePlugin = ref.corePlugin;
  var pieces = ref.pieces;
  var state = ref.state;
  var dynamicKey = ref.dynamicKey;
  var rest$1 = objectWithoutProperties$2(ref, [
    "corePlugin",
    "classNameRaw",
    "pieces",
    "state",
    "dynamicKey",
  ]);
  var rest = rest$1;

  var errors = getErrors({
    state: state,
    pieces: pieces,
    dynamicKey: dynamicKey,
  });

  var match = function (regex) {
    return dlv(pieces.className.match(regex), [0]) || null;
  };

  var context = Object.assign(
    {},
    {
      state: function () {
        return state;
      },
      errors: errors,
      pieces: pieces,
      match: match,
      getConfigValue: getConfigValue,
    },
    rest
  );
  return callPlugin(corePlugin, context);
};

var getStyles = function (classes, t, state) {
  throwIf([null, "null", undefined].includes(classes), function () {
    return logGeneralError(
      'Only plain strings can be used with "tw".\nRead more at https://twinredirect.page.link/template-literals'
    );
  }); // Strip pipe dividers " | "

  classes = classes.replace(/ \| /g, " "); // Unwrap grouped variants

  classes = handleVariantGroups(classes); // Move and sort the responsive items to the end of the list

  var classesOrdered = orderByScreens(classes, state);
  var theme = getTheme(state.config.theme); // Merge styles into a single css object

  var styles = classesOrdered.reduce(function (results, classNameRaw) {
    doPrechecks([precheckGroup], {
      classNameRaw: classNameRaw,
    });
    var pieces = getPieces({
      classNameRaw: classNameRaw,
      state: state,
    });
    var className = pieces.className;
    var hasVariants = pieces.hasVariants;
    var configTwin = state.configTwin;
    throwIf(!className, function () {
      return hasVariants
        ? logNotFoundVariant({
            classNameRaw: classNameRaw,
          })
        : logNotFoundClass;
    });
    var ref = getProperties(className, state);
    var hasMatches = ref.hasMatches;
    var hasUserPlugins = ref.hasUserPlugins;
    var dynamicKey = ref.dynamicKey;
    var dynamicConfig = ref.dynamicConfig;
    var corePlugin = ref.corePlugin;
    var type = ref.type; // Kick off suggestions when no class matches

    throwIf(!hasMatches && !hasUserPlugins, function () {
      return errorSuggestions({
        pieces: pieces,
        state: state,
      });
    });
    var styleHandler = {
      static: function () {
        return handleStatic({
          pieces: pieces,
        });
      },
      dynamic: function () {
        return handleDynamic({
          theme: theme,
          pieces: pieces,
          state: state,
          dynamicKey: dynamicKey,
          dynamicConfig: dynamicConfig,
        });
      },
      userPlugin: function () {
        return handleUserPlugins({
          state: state,
          className: className,
        });
      },
      corePlugin: function () {
        return handleCorePlugins({
          theme: theme,
          pieces: pieces,
          state: state,
          configTwin: configTwin,
          corePlugin: corePlugin,
          classNameRaw: classNameRaw,
          dynamicKey: dynamicKey,
        });
      },
    };
    var style;

    if (hasUserPlugins) {
      style = applyTransforms({
        type: type,
        pieces: pieces,
        style: styleHandler.userPlugin(),
      });
    } // Check again there are no userPlugin matches

    throwIf(!hasMatches && !style, function () {
      return errorSuggestions({
        pieces: pieces,
        state: state,
      });
    });
    style =
      style ||
      applyTransforms({
        type: type,
        pieces: pieces,
        style: styleHandler[type](),
      });
    var result = deepMerge(
      results,
      pieces.hasVariants
        ? addVariants({
            results: results,
            style: style,
            pieces: pieces,
          })
        : style
    );
    state.debug && debug(classNameRaw, style);
    return result;
  }, {});
  return astify(isEmpty(styles) ? {} : styles, t);
};

var handleTwProperty = function (ref) {
  var path$$1 = ref.path;
  var t = ref.t;
  var state = ref.state;

  if (path$$1.node.name.name === "css") {
    state.hasCssProp = true;
  } // TODO: Add tw-prop for css attributes

  if (path$$1.node.name.name !== "tw") {
    return;
  }
  state.hasTwProp = true;
  var nodeValue = path$$1.node.value; // Allow tw={"class"}

  var expressionValue =
    nodeValue.expression &&
    nodeValue.expression.type === "StringLiteral" &&
    nodeValue.expression.value; // Feedback for unsupported usage

  throwIf(nodeValue.expression && !expressionValue, function () {
    return logGeneralError(
      'Only plain strings can be used with the "tw" prop.\nEg: <div tw="text-black" /> or <div tw={"text-black"} />'
    );
  });
  var rawClasses = expressionValue || nodeValue.value || "";
  var styles = getStyles(rawClasses, t, state);
  var jsxPath = path$$1.findParent(function (p) {
    return p.isJSXOpeningElement();
  });
  var attributes = jsxPath.get("attributes");
  var cssAttributes = attributes.filter(function (p) {
    return p.node.name && p.node.name.name === "css";
  });

  if (cssAttributes.length > 0) {
    path$$1.remove();
    var expr = cssAttributes[0].get("value").get("expression");

    if (expr.isArrayExpression()) {
      // TODO: unshiftContainer could also be supported here so we can
      // preserve the original position of the css prop.
      // But it would break the specificity of existing css+tw combinations.
      expr.pushContainer("elements", styles);
    } else {
      throwIf(!expr.node, function () {
        return logGeneralError(
          'An empty css prop (css="") isn’t supported alongside the tw prop (tw="...")'
        );
      });
      expr.replaceWith(t.arrayExpression([expr.node, styles]));
    }

    addDebugPropToExistingPath({
      t: t,
      attributes: attributes,
      rawClasses: rawClasses,
      path: jsxPath,
      state: state,
    });
  } else {
    path$$1.replaceWith(t.jsxAttribute(t.jsxIdentifier("css"), t.jsxExpressionContainer(styles)));
    addDebugPropToPath({
      t: t,
      attributes: attributes,
      rawClasses: rawClasses,
      path: path$$1,
      state: state,
    });
  }
};

var handleTwFunction = function (ref) {
  var references = ref.references;
  var state = ref.state;
  var t = ref.t;

  var defaultImportReferences = references.default || references.tw || [];
  defaultImportReferences.forEach(function (path$$1) {
    var parent = path$$1.findParent(function (x) {
      return x.isTaggedTemplateExpression();
    });
    if (!parent) {
      return;
    } // Check if the style attribute is being used

    if (!state.configTwin.allowStyleProp) {
      var jsxAttribute = parent.findParent(function (x) {
        return x.isJSXAttribute();
      });
      var attributeName = jsxAttribute && jsxAttribute.get("name").get("name").node;
      throwIf(attributeName === "style", function () {
        return logStylePropertyError;
      });
    }

    var parsed = parseTte({
      path: parent,
      types: t,
      styledIdentifier: state.styledIdentifier,
      state: state,
    });
    if (!parsed) {
      return;
    }
    var rawClasses = parsed.string; // Add tw-prop for css attributes

    var jsxPath = path$$1.findParent(function (p) {
      return p.isJSXOpeningElement();
    });

    if (jsxPath) {
      var attributes = jsxPath.get("attributes");
      addDebugPropToExistingPath({
        t: t,
        attributes: attributes,
        rawClasses: rawClasses,
        path: jsxPath,
        state: state,
      });
    }

    replaceWithLocation(parsed.path, getStyles(rawClasses, t, state));
  });
};

var parseSelector = function (selector) {
  if (!selector) {
    return;
  }
  var matches = selector.trim().match(/^(\S+)(\s+.*?)?$/);
  if (matches === null) {
    return;
  }
  return matches[0].replace(/\./g, "");
};

var camelize = function (string) {
  return (
    string &&
    string.replace(/\W+(.)/g, function (match, chr) {
      return chr.toUpperCase();
    })
  );
};

var buildAtSelector = function (name, values, screens) {
  // Support @screen selectors
  if (name === "screen") {
    var screenValue = screens[values];
    if (screenValue) {
      return "@media (min-width: " + screenValue + ")";
    }
  }

  return "@" + name + " " + values;
};

var getUserPluginRules = function (rules, screens) {
  return rules.reduce(function (result, rule) {
    var obj;

    // Build the media queries
    if (rule.type === "atrule") {
      // Remove a bunch of nodes that tailwind uses for limiting rule generation
      // https://github.com/tailwindlabs/tailwindcss/commit/b69e46cc1b32608d779dad35121077b48089485d#diff-808341f38c6f7093a7979961a53f5922R20
      if (["layer", "variants", "responsive"].includes(rule.name)) {
        return deepMerge.apply(void 0, [result].concat(getUserPluginRules(rule.nodes, screens)));
      }

      var atSelector = buildAtSelector(rule.name, rule.params, screens);
      return deepMerge(
        result,
        ((obj = {}), (obj[atSelector] = getUserPluginRules(rule.nodes, screens)), obj)
      );
    }

    var selector = parseSelector(rule.selector); // Rule isn't formatted correctly

    if (selector === null) {
      return null;
    } // Combine the chilren styles

    var values = rule.nodes.reduce(function (result, rule) {
      var obj;

      return Object.assign({}, result, ((obj = {}), (obj[camelize(rule.prop)] = rule.value), obj));
    }, {}); // Separate comma separated selectors

    var separatedSelectors = selector.split(",").reduce(function (r, i) {
      var obj;

      return Object.assign(
        {},
        r,
        ((obj = {}), (obj[i.replace(/\\\//g, "/").trim()] = values), obj)
      );
    }, {});
    return deepMerge(result, separatedSelectors);
  }, {});
};

var getUserPluginData = function (ref) {
  var config = ref.config;

  if (!config.plugins || config.plugins.length === 0) {
    return;
  } // Use Tailwind (using PostCss) to process the plugin data

  var processedPlugins = processPlugins(config.plugins, config);
  /**
   * Variants
   */
  // No support for Tailwind's addVariant() function

  /**
   * Components
   */

  var components = getUserPluginRules(processedPlugins.components, config.theme.screens);
  /**
   * Utilities
   */

  var utilities = getUserPluginRules(processedPlugins.utilities, config.theme.screens);
  return {
    components: components,
    utilities: utilities,
  };
};

/* eslint-disable complexity */

var getPackageUsed = function (ref) {
  var preset = ref.config.preset;
  var cssImport = ref.cssImport;
  var styledImport = ref.styledImport;

  return {
    isEmotion: preset === "emotion" || cssImport.from.includes("emotion"),
    isStyledComponents:
      preset === "styled-components" || cssImport.from.includes("styled-components"),
    isGoober:
      preset === "goober" ||
      styledImport.from.includes("goober") ||
      cssImport.from.includes("goober"),
  };
};

var twinMacro = function (ref) {
  var t = ref.babel.types;
  var references = ref.references;
  var state = ref.state;
  var config = ref.config;

  validateImports(references);
  var program = state.file.path;
  var ref$1 = getConfigTailwindProperties(state, config);
  var configExists = ref$1.configExists;
  var configTailwind = ref$1.configTailwind; // Get import presets

  var styledImport = getStyledConfig(config);
  var cssImport = getCssConfig(config); // Identify the css-in-js library being used

  var packageUsed = getPackageUsed({
    config: config,
    cssImport: cssImport,
    styledImport: styledImport,
  });

  for (var i = 0, list = Object.entries(packageUsed); i < list.length; i += 1) {
    var ref$2 = list[i];
    var key = ref$2[0];
    var value = ref$2[1];

    state[key] = value;
  }

  var configTwin = getConfigTwinValidated(config, state);
  state.configExists = configExists;
  state.config = configTailwind;
  state.configTwin = configTwin;
  state.tailwindConfigIdentifier = generateUid("tailwindConfig", program);
  state.tailwindUtilsIdentifier = generateUid("tailwindUtils", program);

  var isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev" || false;
  state.isDev = isDev;
  state.isProd = !isDev;
  state.debugProp = isDev ? Boolean(config.debugProp) : false;
  state.debug = isDev ? Boolean(config.debug) : false;
  state.userPluginData = getUserPluginData({
    config: state.config,
  });
  isDev &&
    Boolean(config.debugPlugins) &&
    state.userPluginData &&
    debugPlugins(state.userPluginData);
  state.styledImport = styledImport;
  state.cssImport = cssImport; // Init identifiers

  state.styledIdentifier = null;
  state.cssIdentifier = null; // Group traversals together for better performance

  program.traverse({
    ImportDeclaration: function ImportDeclaration(path$$1) {
      setStyledIdentifier({
        state: state,
        path: path$$1,
        styledImport: styledImport,
      });
      setCssIdentifier({
        state: state,
        path: path$$1,
        cssImport: cssImport,
      });
    },

    JSXAttribute: function JSXAttribute(path$$1) {
      handleTwProperty({
        path: path$$1,
        t: t,
        state: state,
      });
    },
  });

  if (state.styledIdentifier === null) {
    state.styledIdentifier = generateUid("styled", program);
  } else {
    state.existingStyledIdentifier = true;
  }

  if (state.cssIdentifier === null) {
    state.cssIdentifier = generateUid("css", program);
  } else {
    state.existingCssIdentifier = true;
  }

  handleTwFunction({
    references: references,
    t: t,
    state: state,
  });
  state.isImportingCss = !isEmpty(references.css) && !state.existingCssIdentifier; // GlobalStyles import

  handleGlobalStylesFunction({
    references: references,
    program: program,
    t: t,
    state: state,
    config: config,
  }); // Css import

  updateCssReferences(references.css, state);

  if (state.isImportingCss) {
    addCssImport({
      program: program,
      t: t,
      cssImport: cssImport,
      state: state,
    });
  } // Styled import

  updateStyledReferences(references.styled, state);
  if (!isEmpty(references.styled)) {
    state.shouldImportStyled = true;
  }

  if (state.shouldImportStyled && !state.existingStyledIdentifier) {
    addStyledImport({
      program: program,
      t: t,
      styledImport: styledImport,
      state: state,
    });
  } // Theme import

  handleThemeFunction({
    references: references,
    t: t,
    state: state,
  }); // Auto add css prop for styled components

  if (
    (state.hasTwProp || state.hasCssProp) &&
    configTwin.autoCssProp === true &&
    state.isStyledComponents
  ) {
    maybeAddCssProperty({
      program: program,
      t: t,
    });
  }

  program.scope.crawl();
};

var macro = createMacro(twinMacro, {
  configName: "twin",
});

export default macro;
