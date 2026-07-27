/**
 * adHocRubric — synthesize a Rubric from one or more natural-language
 * criteria without invoking the LLM-based rubric generator.
 *
 * Used by migrated custom agent tasks whose original verification was a
 * single `V3Evaluator.ask({question})` YES/NO call. Each criterion becomes
 * a 1-point rubric item.
 *
 * For tasks that already have a concrete predicate ("Does the page show
 * flights from SF to NY?"), pass the predicate verbatim. For the lazy
 * "did the agent complete this task successfully? <instruction>" pattern,
 * pass the instruction.
 */
import type { Rubric } from "@browserbasehq/stagehand";
export declare function adHocRubric(...criteria: string[]): Rubric;
