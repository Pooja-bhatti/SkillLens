// Concept Selector — picks the next concept to question the candidate on
// Priority: highest weight unexplored (fsmState !== MOVE_ON) concept first
// Within same weight: prefer concepts with fewest questionsAsked

/**
 * Select the next concept node to interview the candidate on.
 * @param {Object[]} competencyNodes - array of competency node objects from the interview
 * @returns {Object|null}            - the chosen node, or null if all concepts exhausted
 */
export function selectNextConcept(competencyNodes) {
    const MAX_QUESTIONS_PER_CONCEPT = 3;

    // Filter: only nodes that haven't been maxed out and aren't MOVE_ON
    const available = competencyNodes.filter(node =>
        node.fsmState !== "MOVE_ON" && node.questionsAsked < MAX_QUESTIONS_PER_CONCEPT
    );

    if (available.length === 0) return null;

    // Find the highest weight among available nodes
    const highestWeight = Math.max(...available.map(n => n.weight));

    // Get all nodes in that top weight tier
    const topTier = available.filter(n => n.weight === highestWeight);

    // Within the top tier, prefer nodes with fewer questions asked
    // But add randomness among nodes with the same questionsAsked count
    // so the interview never feels predictable
    const minAsked = Math.min(...topTier.map(n => n.questionsAsked));
    const leastAsked = topTier.filter(n => n.questionsAsked === minAsked);

    // Random pick among the least-asked nodes in the top tier
    return leastAsked[Math.floor(Math.random() * leastAsked.length)];
}

/**
 * Update a competency node after the candidate answers a question.
 * Uses weighted moving average for mastery (no magic constants).
 *
 * @param {Object} node     - the competency node to update
 * @param {number} score    - evaluation score [0.0 - 1.0]
 * @param {string} evidence - short evidence string to log (e.g. "Answered ACID correctly (82%)")
 * @param {string} nextFsmState - the next FSM state from fsmEngine
 * @returns {Object}        - updated node
 */
export function updateCompetencyNode(node, score, evidence, nextFsmState) {
    const BUDGET = 3;

    // Weighted moving average — no magic constants
    node.mastery = (node.mastery * node.questionsAsked + score) / (node.questionsAsked + 1);

    // Confidence: ratio of questions asked to budget
    node.questionsAsked += 1;
    node.confidence = Math.min(1.0, node.questionsAsked / BUDGET);

    // Log explainable evidence
    node.evidence.push(evidence);
    node.lastAsked = new Date();
    node.fsmState = nextFsmState;

    return node;
}
