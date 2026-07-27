import { z } from "zod";
import { formatSnapshotTree } from "./snapshot-format.js";
export const snapshotHandlers = {
    async snapshot(manager, params) {
        const { full, filter, maxDepth } = z
            .object({
            full: z.boolean().optional(),
            filter: z.string().optional(),
            maxDepth: z.number().int().nonnegative().optional(),
        })
            .parse(params);
        const page = await manager.activePage();
        const snapshot = await page.snapshot();
        manager.setRefMaps({
            urlMap: snapshot.urlMap ?? {},
            xpathMap: snapshot.xpathMap ?? {},
        });
        const tree = formatSnapshotTree(snapshot.formattedTree, {
            filter,
            maxDepth,
        });
        if (full) {
            return {
                tree,
                urlMap: snapshot.urlMap,
                xpathMap: snapshot.xpathMap,
            };
        }
        return { tree };
    },
};
