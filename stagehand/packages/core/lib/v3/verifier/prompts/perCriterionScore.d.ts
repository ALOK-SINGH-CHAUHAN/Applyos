/**
 * Per-criterion scoring prompt — Approach A's replacement for Steps 4 + 6.
 *
 * One call grades ONE criterion against its top-K evidence (images + text),
 * returning both an analysis and an earned-points score. With N criteria
 * this is N calls (parallelizable). Drops the Step-6 whole-rubric rescore
 * entirely since `processScore` becomes Σ earned_points / Σ max_points.
 *
 * Variables:
 *   - task_definition          — instruction string
 *   - init_url_context         — "Starting URL: ..." or empty
 *   - action_history           — compact textual action history
 *   - agent_predicted_output   — agent's final answer / message
 *   - criterion_idx            — index in the rubric
 *   - criterion_name           — the criterion text
 *   - criterion_description    — description of what's being measured
 *   - criterion_max_points     — max points for this criterion
 *   - criterion_condition      — optional "Condition: ..." line, or empty
 *   - evidence_manifest        — labelled list of the top-K evidence points
 *                                attached below (image refs + ariaTree
 *                                snippets in chronological order).
 */
export declare const MM_PER_CRITERION_SCORE_PROMPT = "Task: $task_definition$init_url_context\n\nYou are scoring ONE rubric criterion against the relevant evidence from an agent's trajectory.\n\n**Action History:**\n$action_history\n\n**Agent's Predicted Output (Final Answer):**\n$agent_predicted_output\n\n**Criterion #$criterion_idx \u2014 \"$criterion_name\"**\n- Description: $criterion_description\n- Max points: $criterion_max_points\n$criterion_condition\n\n**Evidence (top-K most relevant):**\n$evidence_manifest\n\nEach evidence reference points to an image attached below or to a text snippet shown inline above. Screenshots are listed in chronological order; when two screenshots show the same element, **the LATER screenshot reflects the final state and takes precedence**.\n\n**Core Evaluation Principles:**\n\n1. **Best Effort.** Reward effort within constraints the agent cannot control.\n2. **Uncontrollable blockers** (CAPTCHA, login walls, sold out, site down, entity nonexistence) \u2192 award full credit when screenshots confirm the blocker.\n3. **Controllable failures** (wrong selections when correct options exist, hallucinations, premature giveup) \u2192 penalize per severity.\n4. **Hard constraints in the task** (specific qualifications, attributes, filters) \u2192 only award full credit when the constraint is actually met in the final evidence, not just searched for.\n5. **Conditional criteria.** If this criterion has a Condition and the condition is NOT met, set `earned_points` to `criterion_max_points` (criterion is not applicable) and note this in the justification.\n6. **Nitpick vs critical error scoring:**\n   - Only nitpicks \u2192 75\u2013100% of max\n   - Correct approach, wrong final answer \u2192 40\u201380%\n   - Critical error \u2192 penalize per severity\n\n**Output Format:**\n\nOutput one JSON object:\n\n{{\n  \"criterion_idx\": $criterion_idx,\n  \"applicable_evidence\": \"Which evidence supports the score; cite by 'Screenshot N \u2014 step=K' or aria-tree step number. If no evidence is applicable, state that.\",\n  \"justification\": \"How the evidence supports the score. If using condition-not-met rule, explain.\",\n  \"earned_points\": <number in [0, $criterion_max_points]>,\n  \"evidence_sufficient\": true,\n  \"condition_met\": null\n}}\n\n- `earned_points` must be in [0, $criterion_max_points].\n- `evidence_sufficient` = false when the available evidence is genuinely too sparse to grade fairly. The verifier will mark the criterion as evidence-insufficient.\n- `condition_met` is a boolean when the criterion has a Condition; otherwise null.\n\nDO NOT OUTPUT ANYTHING OTHER THAN JSON.\n";
