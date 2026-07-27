import { z } from "zod";
export const keyboardHandlers = {
    async type(manager, params) {
        const { delay, mistakes, text } = z
            .object({
            delay: z.number().int().nonnegative().optional(),
            mistakes: z.boolean().optional(),
            text: z.string(),
        })
            .parse(params);
        const page = await manager.activePage();
        await page.type(text, { delay, withMistakes: mistakes });
        return { typed: true };
    },
    async key(manager, params) {
        const { key } = z.object({ key: z.string().min(1) }).parse(params);
        const page = await manager.activePage();
        await page.keyPress(key);
        return { pressed: key };
    },
};
