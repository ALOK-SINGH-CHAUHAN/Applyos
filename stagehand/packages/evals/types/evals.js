import { z } from "zod";
export const EvalCategorySchema = z.enum([
    "observe",
    "act",
    "combination",
    "extract",
    "experimental",
    "targeted_extract",
    "regression",
    "regression_llm_providers",
    "agent",
    "external_agent_benchmarks",
]);
