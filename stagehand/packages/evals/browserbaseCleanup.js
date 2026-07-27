const CLOSE_TIMEOUT_MS = 5_000;
async function settleWithTimeout(promise, timeoutMs) {
    let timeoutId;
    const timeout = new Promise((resolve) => {
        timeoutId = setTimeout(resolve, timeoutMs);
    });
    try {
        await Promise.race([promise.catch(() => { }), timeout]);
    }
    finally {
        if (timeoutId)
            clearTimeout(timeoutId);
    }
}
export async function endBrowserbaseSession(v3) {
    if (!v3?.isBrowserbase)
        return;
    if ((process.env.USE_API ?? "").toLowerCase() === "true")
        return;
    try {
        await settleWithTimeout(v3.context.conn.send("Browser.close"), CLOSE_TIMEOUT_MS);
    }
    catch {
        // best-effort cleanup
    }
}
