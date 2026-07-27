export interface SnapshotFilterOptions {
    compact?: boolean;
    filter?: string;
    maxDepth?: number;
}
export declare function formatSnapshotTree(tree: string, options?: SnapshotFilterOptions): string;
