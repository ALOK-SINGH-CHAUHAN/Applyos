import { describe, expect, it, vi } from "vitest";
import { V3Evaluator } from "../../lib/v3Evaluator.js";
describe("V3Evaluator verifier facade", () => {
    it("rejects ask when configured for the verifier backend", async () => {
        const evaluator = new V3Evaluator({}, {
            backend: "verifier",
        });
        await expect(evaluator.ask({ question: "Was the task completed?" })).rejects.toThrow("STAGEHAND_EVALUATOR_BACKEND=verifier, but the verifier backend only supports verify() and generateRubric()");
    });
    it("returns a verifier result for empty trajectories without LLM calls", async () => {
        const taskSpec = {
            id: "empty-verifier",
            instruction: "Complete the task",
        };
        const evaluator = new V3Evaluator({}, {
            backend: "verifier",
        });
        const result = await evaluator.verify(makeEmptyTrajectory(taskSpec));
        expect(result.outcomeSuccess).toBe(false);
        expect(result.rawSteps).toMatchObject({
            reason: "empty-trajectory",
            rubricSource: "none",
        });
    });
    it("generates rubrics through the verifier backend", async () => {
        const createChatCompletion = vi.fn().mockResolvedValue({
            data: {
                items: [
                    {
                        criterion: "Complete the task",
                        task_span: "Complete the task",
                        description: "Full credit if the task is complete.",
                        max_points: 1,
                        justification: "",
                        earned_points: "",
                    },
                ],
            },
        });
        const evaluator = new V3Evaluator({}, {
            backend: "verifier",
        });
        Object.defineProperty(evaluator, "getRubricGenClient", {
            value: () => ({ createChatCompletion }),
        });
        const rubric = await evaluator.generateRubric({
            id: "rubric",
            instruction: "Complete the task",
        });
        expect(rubric).toEqual({
            items: [
                {
                    criterion: "Complete the task",
                    description: "Full credit if the task is complete.",
                    maxPoints: 1,
                },
            ],
        });
    });
    it("maps legacy YES evaluations with trajectory screenshots to a successful result", async () => {
        const taskSpec = {
            id: "success",
            instruction: "Complete the task",
        };
        const screenshot = Buffer.from("screenshot");
        const trajectory = makeTrajectory(taskSpec, {
            screenshot,
            finalAnswer: "The task is complete.",
        });
        const ask = vi.fn().mockResolvedValue({
            evaluation: "YES",
            reasoning: "The screenshot shows completion.",
        });
        const evaluator = new V3Evaluator({}, {
            backend: "legacy",
        });
        Object.defineProperty(evaluator, "legacyEvaluator", {
            value: { ask },
        });
        const result = await evaluator.verify(trajectory);
        expect(ask).toHaveBeenCalledWith(expect.objectContaining({
            question: taskSpec.instruction,
            screenshot: [screenshot],
            answer: "The task is complete.",
        }));
        expect(result.outcomeSuccess).toBe(true);
        expect(result.explanation).toBe("The screenshot shows completion.");
        expect(result.processScore).toBeUndefined();
        expect(result.perCriterion).toBeUndefined();
    });
    it("passes final observation screenshots to the legacy verifier adapter", async () => {
        const taskSpec = {
            id: "final-observation",
            instruction: "Complete the task",
        };
        const finalScreenshot = Buffer.from("final screenshot");
        const trajectory = {
            ...makeTrajectory(taskSpec),
            finalObservation: {
                url: "https://example.com/done",
                screenshot: finalScreenshot,
            },
        };
        const ask = vi.fn().mockResolvedValue({
            evaluation: "YES",
            reasoning: "The final screenshot shows completion.",
        });
        const evaluator = new V3Evaluator({}, {
            backend: "legacy",
        });
        Object.defineProperty(evaluator, "legacyEvaluator", {
            value: { ask },
        });
        await evaluator.verify(trajectory);
        expect(ask).toHaveBeenCalledWith(expect.objectContaining({
            screenshot: [finalScreenshot],
        }));
    });
    it("keeps legacy tool output detail until the overall reasoning budget is reached", async () => {
        const taskSpec = {
            id: "reasoning-budget",
            instruction: "Complete the task",
        };
        const longToolOutput = "x".repeat(3000);
        const ask = vi.fn().mockResolvedValue({
            evaluation: "YES",
            reasoning: "The trajectory shows completion.",
        });
        const evaluator = new V3Evaluator({}, {
            backend: "legacy",
        });
        Object.defineProperty(evaluator, "legacyEvaluator", {
            value: { ask },
        });
        await evaluator.verify(makeTrajectory(taskSpec, {
            finalAnswer: "The task is complete.",
            toolResult: longToolOutput,
        }));
        const firstCall = ask.mock.calls[0]?.[0];
        expect(firstCall?.agentReasoning).toContain(longToolOutput);
        expect(firstCall?.agentReasoning).not.toContain("Final answer:");
        expect(firstCall?.answer).toBe("The task is complete.");
    });
    it("returns an evidence-insufficient legacy result for empty trajectories", async () => {
        const taskSpec = {
            id: "empty",
            instruction: "Complete the task",
        };
        const evaluator = new V3Evaluator({}, {
            backend: "legacy",
        });
        const result = await evaluator.verify(makeEmptyTrajectory(taskSpec));
        expect(result).toMatchObject({
            outcomeSuccess: false,
            explanation: "Legacy evaluator compatibility mode had no screenshots or final answer to evaluate.",
            rawSteps: {
                backend: "legacy",
                legacyEvaluation: "INVALID",
                screenshotCount: 0,
            },
        });
        expect(result.processScore).toBeUndefined();
        expect(result.perCriterion).toBeUndefined();
    });
    it("rejects invalid evaluator backend env values", () => {
        const previousBackend = process.env.STAGEHAND_EVALUATOR_BACKEND;
        process.env.STAGEHAND_EVALUATOR_BACKEND = "not-a-backend";
        try {
            expect(() => new V3Evaluator({})).toThrow('Invalid STAGEHAND_EVALUATOR_BACKEND="not-a-backend"');
        }
        finally {
            if (previousBackend === undefined) {
                delete process.env.STAGEHAND_EVALUATOR_BACKEND;
            }
            else {
                process.env.STAGEHAND_EVALUATOR_BACKEND = previousBackend;
            }
        }
    });
});
function makeEmptyTrajectory(taskSpec) {
    return {
        task: taskSpec,
        steps: [],
        status: "complete",
        usage: {
            input_tokens: 0,
            output_tokens: 0,
        },
    };
}
function makeTrajectory(taskSpec, options = {}) {
    return {
        ...makeEmptyTrajectory(taskSpec),
        steps: [
            {
                actionName: "act",
                actionArgs: {},
                reasoning: "I completed the task.",
                agentEvidence: { modalities: [] },
                probeEvidence: options.screenshot
                    ? { screenshot: options.screenshot }
                    : {},
                toolOutput: {
                    ok: true,
                    result: options.toolResult ?? "done",
                },
            },
        ],
        finalAnswer: options.finalAnswer,
    };
}
