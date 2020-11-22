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
    mediaQueryLists.forEach((mediaQueryList) => mediaQueryList.addEventListener("change", handler));
    return () =>
      mediaQueryLists.forEach((mediaQueryList) =>
        mediaQueryList.removeEventListener("change", handler)
      );
  }, [getValue, mediaQueryLists]);

  return value;
};
