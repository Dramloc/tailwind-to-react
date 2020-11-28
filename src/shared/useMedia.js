import { useCallback, useEffect, useMemo, useState } from "react";

/** @type {<T>(queries: string[], values: T[], defaultValue: T) => T} */
export const useMedia = (queries, values, defaultValue) => {
  const mediaQueryLists = useMemo(() => queries.map((q) => window.matchMedia(q)), [queries]);

  const getValue = useCallback(() => {
    const index = mediaQueryLists.findIndex((mql) => mql.matches);
    return typeof values[index] !== "undefined" ? values[index] : defaultValue;
  }, [defaultValue, mediaQueryLists, values]);

  const [value, setValue] = useState(getValue);

  useEffect(() => {
    const handler = () => setValue(getValue);
    // FIXME: addListener(handler) should be replaced with addEventListener("change", handler) when browser support allows it
    mediaQueryLists.forEach((mediaQueryList) => mediaQueryList.addListener(handler));
    return () =>
      // FIXME: removeListener(handler) should be replaced with removeEventListener("change", handler) when browser support allows it
      mediaQueryLists.forEach((mediaQueryList) => mediaQueryList.removeListener(handler));
  }, [getValue, mediaQueryLists]);

  return value;
};
