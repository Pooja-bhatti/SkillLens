// Assessment Completion Engine
// Determines when the interview has collected enough evidence to stop

/**
 * Decide whether the interview should stop.
 *
 * Stopping rules (in priority order):
 *  1. Hard minimum: never stop before 5 questions (need a baseline)
 *  2. Hard maximum: always stop at 10 questions (prevent fatigue)
 *  3. Adaptive early stop: stop if all weight>=2 nodes (resume claims) have been explored
 *
 * @param {number}   totalQuestionsAsked  - total questions submitted so far
 * @param {Object[]} competencyNodes      - full competency node array from the interview
 * @returns {{ stop: boolean, reason: string }}
 */
export function assessmentCompletion(totalQuestionsAsked, competencyNodes) {
    // Rule 1: Hard minimum — always ask at least 5 questions
    if (totalQuestionsAsked < 5) {
        return { stop: false, reason: "Below minimum question count (5)" };
    }

    // Rule 2: Hard maximum — stop at 10 to prevent session fatigue
    if (totalQuestionsAsked >= 10) {
        return { stop: true, reason: "Maximum question limit reached (10)" };
    }

    // Rule 3: Adaptive early stop — all resume claim nodes (weight >= 2) have been touched
    const claimNodes = competencyNodes.filter(n => n.weight >= 2);
    if (claimNodes.length > 0) {
        const allClaimsExplored = claimNodes.every(n => n.questionsAsked > 0);
        if (allClaimsExplored) {
            return {
                stop: true,
                reason: "All resume claims verified. Sufficient evidence collected."
            };
        }
    }

    // Rule 4: If no more concepts are available (all MOVE_ON or maxed), stop gracefully
    const remaining = competencyNodes.filter(
        n => n.fsmState !== "MOVE_ON" && n.questionsAsked < 3
    );
    if (remaining.length === 0) {
        return { stop: true, reason: "All concept budgets exhausted." };
    }

    return { stop: false, reason: "Continuing interview" };
}
