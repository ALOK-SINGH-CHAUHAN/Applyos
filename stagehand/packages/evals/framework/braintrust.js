let braintrustPromise;
export function hasBraintrustApiKey() {
    return Boolean(process.env.BRAINTRUST_API_KEY);
}
export function loadBraintrust() {
    braintrustPromise ??= import("braintrust");
    return braintrustPromise;
}
const NOOP_SPAN = {
    log: () => { },
};
export async function tracedSpan(fn, options) {
    if (!hasBraintrustApiKey()) {
        return fn(NOOP_SPAN);
    }
    const { traced } = await loadBraintrust();
    return traced(fn, options);
}
