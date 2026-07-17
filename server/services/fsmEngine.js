// FSM State Machine Engine
// Controls transition between interview strategy states based on candidate score

/**
 * Possible FSM states:
 *   EXPLORE    → initial warm-up question for a concept
 *   VERIFY     → follow-up after good EXPLORE (score > 0.8)
 *   DEEP_DIVE  → harder question after good VERIFY (score > 0.8)
 *   CLARIFY    → simpler follow-up after weak EXPLORE (score <= 0.8)
 *   MOVE_ON    → concept budget exhausted or score too low — move to next concept
 */

export const FSM_STATES = {
    EXPLORE: "EXPLORE",
    VERIFY: "VERIFY",
    DEEP_DIVE: "DEEP_DIVE",
    CLARIFY: "CLARIFY",
    MOVE_ON: "MOVE_ON",
};

/**
 * Transition the FSM to the next state based on current state and evaluation score.
 * @param {string} currentState - one of FSM_STATES
 * @param {number} score        - evaluation score [0.0 - 1.0]
 * @returns {string}            - next FSM state
 */
export function getNextFSMState(currentState, score) {
    switch (currentState) {
        case FSM_STATES.EXPLORE:
            // Easy → Medium: score > 0.40
            // all-MiniLM raw similarity for a decent answer is ~0.3-0.45, so 0.40 is the right gate
            return score > 0.40 ? FSM_STATES.VERIFY : FSM_STATES.CLARIFY;
        case FSM_STATES.VERIFY:
            // Medium → Hard: score > 0.55 (needs a stronger answer to go deeper)
            return score > 0.55 ? FSM_STATES.DEEP_DIVE : FSM_STATES.MOVE_ON;
        case FSM_STATES.CLARIFY:
            return FSM_STATES.MOVE_ON;
        case FSM_STATES.DEEP_DIVE:
            return FSM_STATES.MOVE_ON;
        default:
            return FSM_STATES.MOVE_ON;
    }
}

/**
 * Map FSM state to LLM difficulty instruction.
 * @param {string} state - FSM state
 * @returns {string}     - difficulty label for the LLM prompt
 */
export function getStateDifficulty(state) {
    switch (state) {
        case FSM_STATES.EXPLORE:   return "EASY — warm-up conceptual question";
        case FSM_STATES.VERIFY:    return "MEDIUM — verify understanding with a practical scenario";
        case FSM_STATES.DEEP_DIVE: return "HARD — architectural depth or edge case question";
        case FSM_STATES.CLARIFY:   return "EASY — simpler clarifying follow-up to check basics";
        default:                   return "MEDIUM";
    }
}

/**
 * Get the FSM strategy instruction for the LLM prompt.
 * @param {string} state - FSM state
 * @returns {string}     - strategy description for the LLM prompt
 */
export function getStrategyDescription(state) {
    switch (state) {
        case FSM_STATES.EXPLORE:
            return "Ask a warm-up conceptual question to assess the candidate's baseline understanding.";
        case FSM_STATES.VERIFY:
            return "The candidate answered well. Ask a follow-up to verify they understand the concept in practice.";
        case FSM_STATES.DEEP_DIVE:
            return "The candidate is strong on this concept. Challenge them with an architectural, edge case, or optimization question.";
        case FSM_STATES.CLARIFY:
            return "The candidate struggled. Ask a simpler, more basic clarifying question to check their fundamental understanding.";
        default:
            return "Ask a relevant technical question.";
    }
}
