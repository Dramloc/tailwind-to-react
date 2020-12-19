// @ts-check
import { openDB } from "idb";
import { useMutation, useQuery, useQueryClient } from "react-query";

/** @typedef {{ slug: string, name: string, html: string, tailwindConfig: string, thumbnail?: Blob }} Pen */
/** @typedef {{ pens: { value: Pen, key: string } } & import("idb").DBSchema} DB */

/** @type {Promise<import("idb").IDBPDatabase<DB>>} */
const dbPromise = openDB("tailwindtoreact", 1, {
  upgrade(db) {
    db.createObjectStore("pens", {
      keyPath: "slug",
    });
  },
});

/** @type {() => import("react-query").UseQueryResult<Pen[]>} */
export const usePens = () => {
  return useQuery(["pens"], async () => {
    const db = await dbPromise;
    const pens = await db.getAll("pens");
    return pens;
  });
};

/** @type {(penSlug: string) => import("react-query").UseQueryResult<Pen | undefined>} */
export const usePen = (penSlug) => {
  return useQuery(["pen", penSlug], async () => {
    const db = await dbPromise;
    const pen = await db.get("pens", penSlug);
    return pen;
  });
};

/** @type {() => import("react-query").UseMutationResult<Pen, unknown, Pen>} */
export const useCreatePen = () => {
  const queryClient = useQueryClient();
  return useMutation(
    async (pen) => {
      const db = await dbPromise;
      await db.add("pens", pen);
      return pen;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("pens");
      },
    }
  );
};

/** @type {() => import("react-query").UseMutationResult<Pen, unknown, Pen>} */
export const useUpdatePen = () => {
  const queryClient = useQueryClient();
  return useMutation(
    async (pen) => {
      const db = await dbPromise;
      await db.put("pens", pen);
      return pen;
    },
    {
      onSuccess: (pen) => {
        queryClient.invalidateQueries("pens");
        queryClient.invalidateQueries(["pen", pen.slug]);
      },
    }
  );
};
