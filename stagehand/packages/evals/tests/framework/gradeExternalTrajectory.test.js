import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gradeExternalTrajectory } from "../../framework/verifierAdapter.js";
import { EvalLogger } from "../../logger.js";
const mockState = vi.hoisted(() => ({
    evaluationResult: {
        outcomeSuccess: true,
        processScore: 0.92,
    },
}));
vi.mock("@browserbasehq/stagehand", async (importOriginal) => {
    const mod = await importOriginal();
    class FakeV3Evaluator {
        async verify() {
            return mockState.evaluationResult;
        }
        async generateRubric() {
            throw new Error("generateRubric must not be called for this rubric");
        }
    }
    return {
        ...mod,
        V3Evaluator: FakeV3Evaluator,
    };
});
describe("gradeExternalTrajectory", () => {
    const rubric = {
        items: [
            { criterion: "step one", description: "does step one", maxPoints: 1 },
            { criterion: "step two", description: "does step two", maxPoints: 2 },
        ],
    };
    const taskSpec = {
        id: "task-1",
        instruction: "do the thing",
        precomputedRubric: rubric,
    };
    const trajectory = {
        task: taskSpec,
        steps: [{}, {}, {}],
        status: "complete",
        finalAnswer: "done",
        usage: {},
    };
    function grade(baseResult) {
        return gradeExternalTrajectory({
            buildTrajectory: () => trajectory,
            verifier: { v3: {}, taskSpec, dataset: "test" },
            baseResult: { _success: false, ...baseResult },
            errorMessage: "agent reported failure",
            category: "claude_code",
            logger: new EvalLogger(false),
        });
    }
    let savedSuccessMode;
    let savedPersist;
    beforeEach(() => {
        savedSuccessMode = process.env.EVAL_SUCCESS_MODE;
        savedPersist = process.env.VERIFIER_PERSIST_TRAJECTORIES;
        delete process.env.EVAL_SUCCESS_MODE;
        // Keep persistAdapterTrajectory on its no-write path (it defaults to
        // persisting outside CI).
        process.env.VERIFIER_PERSIST_TRAJECTORIES = "0";
    });
    afterEach(() => {
        if (savedSuccessMode === undefined)
            delete process.env.EVAL_SUCCESS_MODE;
        else
            process.env.EVAL_SUCCESS_MODE = savedSuccessMode;
        if (savedPersist === undefined)
            delete process.env.VERIFIER_PERSIST_TRAJECTORIES;
        else
            process.env.VERIFIER_PERSIST_TRAJECTORIES = savedPersist;
        mockState.evaluationResult = { outcomeSuccess: true, processScore: 0.92 };
    });
    it("folds a successful verdict into the task result", async () => {
        const result = await grade({ error: "self-reported failure" });
        expect(result._success).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.outcomeSuccess).toBe(true);
        expect(result.processScore).toBe(0.92);
        expect(result.criterionCount).toBe(2);
        expect(result.stepCount).toBe(3);
        expect(typeof result.trajectoryDir).toBe("string");
        expect(result.verifierError).toBeUndefined();
    });
    it("keeps the error and fails the result when the verdict is negative", async () => {
        mockState.evaluationResult = { outcomeSuccess: false, processScore: 0.1 };
        const result = await grade({});
        expect(result._success).toBe(false);
        expect(result.error).toBe("agent reported failure");
        expect(result.outcomeSuccess).toBe(false);
        expect(result.verifierError).toBeUndefined();
    });
    it("honors EVAL_SUCCESS_MODE=process for the folded _success", async () => {
        process.env.EVAL_SUCCESS_MODE = "process";
        mockState.evaluationResult = { outcomeSuccess: false, processScore: 0.95 };
        const result = await grade({});
        expect(result._success).toBe(true);
        expect(result.processScore).toBe(0.95);
    });
});
