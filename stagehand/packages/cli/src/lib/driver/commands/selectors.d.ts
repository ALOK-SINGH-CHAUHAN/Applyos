export interface RefMaps {
    urlMap: Record<string, string>;
    xpathMap: Record<string, string>;
}
export declare function emptyRefMaps(): RefMaps;
export declare function resolveSelector(selector: string, refMaps: RefMaps): string;
