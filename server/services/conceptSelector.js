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

    // We use a weighted random selection (lottery) so that core CS subjects (weight 1)
    // still have a chance to be asked alongside resume projects (weight 3) and skills (weight 2).
    // To encourage breadth, we reduce the chance of picking a topic that was already asked.
    let totalWeight = 0;
    const weightedNodes = available.map(node => {
        // dynamicWeight = baseWeight / (questionsAsked + 1)
        const dynamicWeight = node.weight / (node.questionsAsked + 1);
        totalWeight += dynamicWeight;
        return { node, dynamicWeight };
    });

    let randomValue = Math.random() * totalWeight;
    for (const item of weightedNodes) {
        randomValue -= item.dynamicWeight;
        if (randomValue <= 0) {
            return item.node;
        }
    }

    return weightedNodes[0].node;
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
