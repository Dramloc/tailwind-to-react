/// @ts-check
import { useQuery } from "react-query";
import { examples } from "./examples";

/** @typedef {{ slug: string, name: string, load: () => Promise<{ html: string, tailwindConfig: string }> }} Example */

/** @type {(exampleSlug: string) => import("react-query").QueryObserverResult<import("../pens/PenQueries").Pen>} */
export const useExample = (exampleSlug) => {
  return useQuery(["example", exampleSlug], async () => {
    const example = examples.find((example) => example.slug === exampleSlug);
    if (example === undefined) {
      return null;
    }
    const content = await example.load();
    return {
      slug: example.slug,
      name: example.name,
      ...content,
    };
  });
};
