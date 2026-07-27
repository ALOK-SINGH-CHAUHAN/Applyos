export type OutputFormat = "json" | "table";
export interface OutputFormatFlags {
    format?: string;
    json?: boolean;
    wide?: boolean;
}
export declare const outputFormatFlags: {
    format: any;
    json: any;
    wide: any;
};
export declare function outputJson(value: unknown): void;
export declare function formatUtcDateTime(value: string | undefined): string;
export declare function formatId(value: string | undefined, wide?: boolean): string;
export declare function resolveOutputFormat(flags: OutputFormatFlags): OutputFormat;
export interface TableColumn<Row> {
    align?: "left" | "right";
    header: string;
    maxWidth?: number;
    value(row: Row): unknown;
}
export declare function outputTable<Row>(rows: Row[], columns: TableColumn<Row>[], options?: {
    wide?: boolean;
}): void;
export declare function formatTable<Row>(rows: Row[], columns: TableColumn<Row>[], options?: {
    wide?: boolean;
}): string;
