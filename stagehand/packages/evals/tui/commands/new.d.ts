/**
 * Scaffold command — generates a new task file with the right boilerplate.
 *
 * Usage: evals new core navigation my_task
 *        evals new bench act my_task
 */
export type ScaffoldedTask = {
    tier: "core" | "bench";
    category: string;
    name: string;
    filePath: string;
    displayPath: string;
    content: string;
};
export declare function scaffoldTask(args: string[]): ScaffoldedTask | null;
