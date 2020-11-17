import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

const ColorModeContext = createContext(null);

const DARK = "dark";
const LIGHT = "light";
const STORAGE_KEY = "prefers-color-scheme";

/** @typedef {(LIGHT | DARK)} ColorMode */

/**
 * @typedef ColorModeContextInterface
 * @property {ColorMode} colorMode
 * @property {() => void} toggleColorMode
 */

export const ColorModeProvider = ({ children }) => {
  const [colorMode, setColorMode] = useState(() => {
    const stored = window.localStorage[STORAGE_KEY];
    if (stored === DARK || stored === LIGHT) {
      return stored;
    }
    return window.matchMedia(`(${STORAGE_KEY}: ${DARK})`).matches
      ? DARK
      : LIGHT;
  });

  const toggleColorMode = useCallback(
    () => setColorMode((colorMode) => (colorMode === DARK ? LIGHT : DARK)),
    []
  );

  useLayoutEffect(() => {
    window.document.body.classList.add(colorMode);
    return () => window.document.body.classList.remove(colorMode);
  }, [colorMode]);

  useEffect(() => {
    window.localStorage[STORAGE_KEY] = colorMode;
  }, [colorMode]);

  const context = useMemo(
    () => ({
      colorMode,
      toggleColorMode,
    }),
    [colorMode, toggleColorMode]
  );
  return (
    <ColorModeContext.Provider value={context}>
      {children}
    </ColorModeContext.Provider>
  );
};

/** @type {() => ColorModeContextInterface} */
export const useColorMode = () => useContext(ColorModeContext);
