export function createMetricsCollector() {
    const data = {};
    function record(name, value) {
        if (!data[name])
            data[name] = [];
        data[name].push(value);
    }
    function startTimer(name) {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            record(name, duration);
            return duration;
        };
    }
    function getAll() {
        return { ...data };
    }
    function percentile(sorted, p) {
        const idx = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, idx)];
    }
    function summarizeValues(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const singleValue = sorted[0];
        if (sorted.length === 1) {
            return {
                count: 1,
                value: singleValue,
            };
        }
        const sum = sorted.reduce((a, b) => a + b, 0);
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: sum / sorted.length,
            p50: percentile(sorted, 50),
            p99: percentile(sorted, 99),
            count: sorted.length,
            value: singleValue,
        };
    }
    function getSummary() {
        const summary = {};
        for (const [name, values] of Object.entries(data)) {
            if (values.length === 0)
                continue;
            summary[name] = summarizeValues(values);
        }
        return summary;
    }
    return { startTimer, record, getAll, getSummary };
}
