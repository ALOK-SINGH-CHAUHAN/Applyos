/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { defineCoreTask, defineBenchTask, defineTask, } from "../../framework/defineTask.js";
describe("defineCoreTask", () => {
    it("returns a TaskDefinition with marker", () => {
        const fn = vi.fn();
        const result = defineCoreTask({ name: "test" }, fn);
        expect(result.__taskDefinition).toBe(true);
        expect(result.meta.name).toBe("test");
        expect(result.fn).toBeDefined();
    });
    it("preserves categories and tags in meta", () => {
        const result = defineCoreTask({ name: "x", categories: ["regression"], tags: ["slow"] }, vi.fn());
        expect(result.meta.categories).toEqual(["regression"]);
        expect(result.meta.tags).toEqual(["slow"]);
    });
});
describe("defineBenchTask", () => {
    it("returns a TaskDefinition with marker", () => {
        const fn = vi.fn();
        const result = defineBenchTask({ name: "bench_test" }, fn);
        expect(result.__taskDefinition).toBe(true);
        expect(result.meta.name).toBe("bench_test");
    });
    it("preserves models override in meta", () => {
        const result = defineBenchTask({ name: "x", models: ["openai/gpt-4o"] }, vi.fn());
        expect(result.meta.models).toEqual(["openai/gpt-4o"]);
    });
});
describe("defineTask", () => {
    it("works the same as the specific variants", () => {
        const fn = vi.fn();
        const result = defineTask({ name: "generic" }, fn);
        expect(result.__taskDefinition).toBe(true);
        expect(result.meta.name).toBe("generic");
        expect(result.fn).toBeDefined();
    });
});
