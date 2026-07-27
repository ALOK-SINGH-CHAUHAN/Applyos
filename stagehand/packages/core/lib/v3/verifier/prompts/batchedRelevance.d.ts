/**
 * Batched evidence-relevance prompt — replacement for the per-screenshot
 * MM_SCREENSHOT_CRITERION_RELEVANCE_PROMPT.
 *
 * One call grades the relevance of B evidence points (mixed image + text)
 * against all N rubric criteria. Reduces Step 2 cost from M calls to
 * ⌈M / B⌉ calls. Each evidence point in the batch is labelled with an
 * `evidence_idx` (0..B-1) the model must echo back so we can join the
 * scores to the right evidence.
 *
 * Variables:
 *   - task_definition    — task instruction string
 *   - init_url_context   — optional "Starting URL: ..." appendix
 *   - rubric_criteria    — numbered list of criteria ("\n{idx}. **{name}**\n   Description: {desc}\n")
 *   - evidence_manifest  — textual list describing each evidence point in the
 *                          batch: kind (image/text), source (probe/agent),
 *                          step index, brief preview. Lets the model line up
 *                          the inline images/text with the `evidence_idx`
 *                          it's expected to score.
 */
export declare const MM_BATCHED_RELEVANCE_PROMPT = "Task: $task_definition$init_url_context\n\nYou are analyzing a batch of evidence points (screenshots and text snippets) from an agent's trajectory to determine which rubric criteria each evidence point helps evaluate.\n\n**Rubric Criteria:**\n$rubric_criteria\n\n**Evidence Points in This Batch:**\n$evidence_manifest\n\nThe evidence is presented to you in order: each image / text block in this message corresponds to one entry in the manifest above, identified by its `evidence_idx`.\n\n**Your Task:**\nFor EACH evidence point in the batch, assign a relevance score from 0\u201310 against EACH criterion.\n\n**Scoring Guidelines:**\n- **10**: Evidence directly shows critical proof for this criterion (e.g., shows the exact item, cart contents, confirmation page, the filled form field).\n- **7-9**: Evidence shows important contextual information for this criterion (search results, applied filters, navigation state).\n- **4-6**: Evidence shows partial / related information for this criterion.\n- **1-3**: Evidence shows minimal relevance to this criterion.\n- **0**: Evidence is completely irrelevant to this criterion.\n\n**Important:**\n- An evidence point can be highly relevant to multiple criteria.\n- Focus on what is VISIBLE in the screenshot or PRESENT in the text snippet, not what the agent claimed.\n- Text-form evidence (e.g., accessibility tree snippets, agent text, JSON tool outputs) is especially relevant for criteria asking \"is this field filled with X?\", \"does the page contain Y?\", or \"did the tool return X?\" \u2014 score it accordingly.\n\n**Output Format:**\nOutput a JSON object with an `items` list. One entry per evidence point in the batch:\n\n{{\n  \"items\": [\n    {{\n      \"evidence_idx\": 0,\n      \"scores\": [\n        {{ \"criterion_idx\": 0, \"score\": 7 }},\n        {{ \"criterion_idx\": 1, \"score\": 2 }}\n      ]\n    }},\n    ...one entry per evidence point...\n  ]\n}}\n\nYou MUST include an entry for every `evidence_idx` listed in the manifest, and every criterion_idx in each `scores` list.\n\nDO NOT OUTPUT ANYTHING OTHER THAN JSON.\n";
