/**
 * Define a core tier task (deterministic, no LLM).
 * Core tasks receive { page, assert, metrics, logger } and throw on failure.
 */
export function defineCoreTask(meta, fn) {
    return {
        __taskDefinition: true,
        meta,
        fn,
    };
}
/**
 * Define a bench tier task (with LLM and evaluator).
 * Bench tasks receive { v3, agent, page, logger, input, ... } and return TaskResult.
 */
export function defineBenchTask(meta, fn) {
    return {
        __taskDefinition: true,
        meta,
        fn,
    };
}
/**
 * Generic defineTask — for cases where the tier is ambiguous at definition time.
 * Prefer defineCoreTask / defineBenchTask for better type inference.
 */
export function defineTask(meta, fn) {
    return {
        __taskDefinition: true,
        meta,
        fn,
    };
}
