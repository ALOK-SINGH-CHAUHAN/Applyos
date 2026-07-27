import type { ZodTypeAny } from "zod/v3";
import { LegacyModel, LegacyProvider } from "../types/model.js";
interface JSONSchema {
    type?: string | string[];
    properties?: Record<string, JSONSchema>;
    required?: string[];
    description?: string;
    items?: JSONSchema;
    enum?: string[];
    minimum?: number;
    maximum?: number;
    format?: "uri" | "url" | "email" | "uuid";
    anyOf?: JSONSchema[];
    oneOf?: JSONSchema[];
    allOf?: JSONSchema[];
    $defs?: Record<string, JSONSchema>;
    $ref?: string;
}
/**
 * Converts a JSON Schema object to a Zod schema.
 * @param schema The JSON Schema object to convert
 * @returns A Zod schema equivalent to the input JSON Schema
 */
export declare function jsonSchemaToZod(schema: JSONSchema): ZodTypeAny;
export declare function mapModelToProvider(model: LegacyModel): LegacyProvider;
export {};
