import { describe, it, expect, vi, beforeEach } from "vitest";
import { V3CuaAgentHandler } from "../../lib/v3/handlers/v3CuaAgentHandler.js";
/**
 * Regression coverage for CUA "keypress" chord handling.
 *
 * A keypress action describes a single key combination (modifiers held down for
 * the main key). The handler used to press each key in the array separately,
 * which released modifiers early — so ["Control", "A"] sent Ctrl alone and then
 * typed a literal "a" instead of select-all. This broke Google's
 * `key_combination`, OpenAI's `keypress`, and Microsoft's `keypress` (all of
 * which emit a multi-element keys array), while Anthropic (single "+"-joined
 * string) happened to work.
 */
describe("V3CuaAgentHandler keypress chord handling", () => {
    let handler;
    let keyPress;
    // executeAction is private; expose it through a typed accessor for the test.
    const execute = (action) => handler.executeAction(action);
    beforeEach(() => {
        keyPress = vi.fn().mockResolvedValue(undefined);
        const mockPage = {
            keyPress,
            url: () => "https://example.com",
        };
        const mockV3 = {
            context: {
                awaitActivePage: vi.fn().mockResolvedValue(mockPage),
            },
            isAgentReplayActive: () => false,
        };
        handler = new V3CuaAgentHandler(mockV3, vi.fn(), {
            modelName: "claude-sonnet-4-5-20250929",
            clientOptions: { apiKey: "test-key" },
        });
    });
    it("presses a multi-key combination as a single chord", async () => {
        await execute({ type: "keypress", keys: ["Control", "A"] });
        expect(keyPress).toHaveBeenCalledTimes(1);
        expect(keyPress).toHaveBeenCalledWith("Control+A");
    });
    it("normalizes provider key aliases before chording (CTRL -> Control)", async () => {
        await execute({ type: "keypress", keys: ["CTRL", "A"] });
        expect(keyPress).toHaveBeenCalledTimes(1);
        expect(keyPress).toHaveBeenCalledWith("Control+A");
    });
    it("still presses a single key correctly", async () => {
        await execute({ type: "keypress", keys: ["Enter"] });
        expect(keyPress).toHaveBeenCalledTimes(1);
        expect(keyPress).toHaveBeenCalledWith("Enter");
    });
    it("preserves an already-combined key string (Anthropic shape)", async () => {
        await execute({ type: "keypress", keys: ["ctrl+s"] });
        expect(keyPress).toHaveBeenCalledTimes(1);
        expect(keyPress).toHaveBeenCalledWith("ctrl+s");
    });
    it("does not press anything for an empty keys array", async () => {
        await execute({ type: "keypress", keys: [] });
        expect(keyPress).not.toHaveBeenCalled();
    });
});
