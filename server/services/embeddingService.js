// Embedding Service — Semantic Answer Evaluation using Transformers.js
// Model: all-MiniLM-L6-v2 (384-dim ONNX, runs natively in Node.js)
// Downloads ~90MB on first use, cached locally after that.

import { pipeline } from "@xenova/transformers";

let extractor = null; // singleton — load once, reuse

/**
 * Pre-warm the embedding model on server startup (optional but recommended).
 * Call this in index.js to avoid a delay on the first interview request.
 */
export async function warmupEmbeddingModel() {
    try {
        console.log("[EmbeddingService] Loading all-MiniLM-L6-v2 model...");
        extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        console.log("[EmbeddingService] Model loaded and ready.");
    } catch (err) {
        console.error("[EmbeddingService] Failed to load model:", err.message);
    }
}

/**
 * Compute cosine similarity between two flat float32 arrays.
 * @param {Float32Array|number[]} a
 * @param {Float32Array|number[]} b
 * @returns {number} cosine similarity [0.0 - 1.0]
 */
function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot   += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get the embedding vector for a text string.
 * @param {string} text
 * @returns {Promise<Float32Array>}
 */
async function embed(text) {
    if (!extractor) {
        extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return output.data; // Float32Array of length 384
}

/**
 * Evaluate a candidate's answer against a list of must-have concept phrases.
 *
 * Algorithm:
 *   1. Embed the candidate answer → v_cand
 *   2. For each must_have phrase: embed it → v_Mi
 *   3. Compute CosineSimilarity(v_cand, v_Mi)
 *   4. Average all similarities → base score
 *   5. Apply length penalty: P = min(1.0, wordCount / 8)
 *   6. Final score = P × average_similarity
 *
 * @param {string}   candidateAnswer - the raw answer text from the candidate
 * @param {string[]} mustHave        - array of expected concept phrases (3-4 items)
 * @returns {Promise<number>}        - evaluation score [0.0 - 1.0]
 */
export async function evaluateAnswer(candidateAnswer, mustHave = []) {
    // Fallback: if no must_have phrases provided or model fails, return mid score
    if (!mustHave || mustHave.length === 0) return 0.55;

    try {
        const candidateVec = await embed(candidateAnswer);

        const similarities = await Promise.all(
            mustHave.map(async (phrase) => {
                const phraseVec = await embed(phrase);
                return cosineSimilarity(candidateVec, phraseVec);
            })
        );

        const averageSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        // Also compute best single match — a good answer that covers ONE key concept
        // well should not be dragged down by covering the others less strongly
        const bestSim = Math.max(...similarities);

        // Blend: 60% best-match + 40% average — rewards hitting the core point
        // while still caring about overall concept coverage
        const blendedSim = 0.6 * bestSim + 0.4 * averageSim;

        // Scale up: 20% base credit + 80% blended similarity
        // With this, raw blended=0.30 → 0.44, raw blended=0.40 → 0.52, raw blended=0.50 → 0.60
        const scaledSim = 0.20 + 0.80 * blendedSim;

        // Length penalty — answers of 5+ words get no penalty
        const wordCount  = candidateAnswer.trim().split(/\s+/).length;
        const P_length   = Math.min(1.0, wordCount / 5);

        const finalScore = P_length * scaledSim;
        return Math.max(0, Math.min(1.0, finalScore)); // clamp to [0,1]


    } catch (err) {
        console.error("[EmbeddingService] Evaluation error:", err.message);
        return 0.55; // safe fallback — mid score, not 0
    }
}
