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
export function assessmentCompletion(totalQuestionsAsked, competencyNodes, mode = "Technical") {
    // For Coding mode, we ignore question counts and rely purely on concept exhaustion
    if (mode === "Coding") {
        const remaining = competencyNodes.filter(
            n => n.fsmState !== "MOVE_ON" && n.questionsAsked < 3
        );
        if (remaining.length === 0) {
            return { stop: true, reason: "Completed all 3 coding problems." };
        }
        return { stop: false, reason: "Continuing coding problems." };
    }

    const minQuestions = mode === "HR" ? 3 : 5;
    const maxQuestions = mode === "HR" ? 5 : 10;

    // Rule 1: Hard minimum
    if (totalQuestionsAsked < minQuestions) {
        return { stop: false, reason: `Below minimum question count (${minQuestions})` };
    }

    // Rule 2: Hard maximum — stop to prevent session fatigue
    if (totalQuestionsAsked >= maxQuestions) {
        return { stop: true, reason: `Maximum question limit reached (${maxQuestions})` };
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
