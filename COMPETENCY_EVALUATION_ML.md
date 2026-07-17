# Adaptive Assessment & Evaluation Engine (InterviewIQ)

This document outlines the simplified, explainable, and highly defensible architecture, algorithmic state machines, and evaluation mathematics for the **InterviewIQ Assessment Engine**.

---

## 1. System Architecture

InterviewIQ transitions away from black-box LLM decision-making. All candidate evaluations, state changes, and concept selections are controlled by **deterministic local algorithms** that are transparent and explainable.

```
                                 Resume Upload
                                       │
                                       ▼
                             Resume Claim Extractor
                                (LLM JSON Parse)
                                       │
                                       ▼
                       Competency Graph Initialization
                    (Weights: Project = 3, Skill = 2, CS = 1)
                                       │
                                       ▼
                           Concept Selection Engine
                   (Highest Weight Unexplored Concept First)
                                       │
                                       ▼
                             Interview Strategy FSM
                       (EXPLORE ➔ VERIFY ➔ DEEP_DIVE)
                                       │
                                       ▼
                            Question Generation (LLM)
                                       │
                                       ▼
                               Candidate Response
                                       │
                                       ▼
                           Semantic Answer Evaluation
                     (Transformers.js Average Similarity)
                                       │
                                       ▼
                        Competency Graph Node Update
                      (Mastery Average & Evidence Logs)
                                       │
                                       ▼
                          Assessment Completion Engine
                      (Budget / Priority Stop Checker)
```

---

## 2. Competency Graph Node Structure (Module 2)

Each concept node in the graph tracks its state explicitly. Rather than relying on magic constants, the audit log contains concrete evidence explaining the node’s score:

```typescript
interface CompetencyNode {
  concept: string;          // Name of the concept (e.g., "SQL Transactions")
  weight: number;           // Priority weight (Project Claim = 3, Skill Claim = 2, Core CS = 1)
  mastery: number;          // Estimated score [0.0 - 1.0]
  confidence: number;       // Confidence score [0.0 - 1.0]
  questionsAsked: number;   // Number of Qs asked for this specific concept
  evidence: string[];       // Audit-ready list of actions / scores
  lastAsked: Date | null;   // Timestamp
}
```

### Claim Priority Weighting
To align the interview with the candidate's actual background, the **Concept Selection Engine** prioritizes nodes using weights:
* **Resume Project Concepts (Weight 3)**: Core concepts extracted directly from project descriptions (e.g., "Redis Caching" if they built a real-time trading app).
* **Resume Skill Claims (Weight 2)**: Statically declared skills in the resume skills list (e.g., "Node.js").
* **Generic Core CS Topics (Weight 1)**: Base topics required for CSE interviews (e.g., "Operating Systems: Deadlocks").

The Selector always picks the unexplored concept with the **highest priority weight** first.

---

## 3. Strategy Finite State Machine (Module 3)

The candidate's path through a concept is controlled by a Finite State Machine (FSM) utilizing clear score thresholds:

```
                          Explore (New Concept)
                                 │
                         ┌───────┴───────┐
                     Score > 0.8     Score <= 0.8
                         │               │
                         ▼               ▼
                      Verify          Clarify (Simple Follow-up)
                         │               │
                 ┌───────┴───────┐   Wrong Answer
             Score > 0.8     Score <= 0.8    │
                 │               │           ▼
                 ▼               ▼        Move On
             Deep Dive        Move On
                 │
                 ▼
              Move On
```

### FSM State Definitions:
1. **`Explore`**: Initial conceptual question to set a baseline.
2. **`Verify`**: Intermediate question triggered only if `Explore` score was $> 0.8$.
3. **`Deep Dive`**: High-difficulty question triggered only if `Verify` score was $> 0.8$.
4. **`Clarify`**: Simple review question triggered if the candidate struggled on `Explore` (score $\le 0.8$).
5. **`Move On`**: Transitions the engine to select the next concept.

---

## 4. Semantic Answer Evaluation (Module 6)

Evaluating a candidate's answer against a single "golden" response is biased toward matching exact wording. Instead, we use **Concept Coverage** based on average semantic similarity.

### The Algorithm
When generating a question, the LLM outputs a list of 3-4 short **core concepts / must-have statements** ($M_i$):
* **Example target**: "Transactions"
* **Must-haves**: `["ACID properties", "all-or-nothing execution", "database consistency"]`

When the candidate submits their answer $A_{cand}$:
1. We compute vector embeddings for the candidate's answer and each must-have statement using `Transformers.js` (`all-MiniLM-L6-v2`):
   $$\vec{v}_{cand} = \text{Embed}(A_{cand})$$
   $$\vec{v}_{M_i} = \text{Embed}(M_i)$$
2. We calculate the Cosine Similarity for each statement:
   $$\text{Sim}(M_i) = \text{CosineSimilarity}(\vec{v}_{cand}, \vec{v}_{M_i})$$
3. **Evaluation Score ($S_{eval}$)**:
   The average cosine similarity of all must-have concepts, multiplied by the length penalty:
   $$S_{eval} = P_{length} \times \left( \frac{\sum_{i=1}^{N} \text{Sim}(M_i)}{N} \right)$$
   *Where $P_{length} = \min(1.0, \frac{\text{WordCount}(A_{cand})}{8})$ handles ultra-short or single-word bypass responses.*

---

## 5. Competency Graph Update (Module 7)

Rather than using complex decay rates or Bayesian math (which are difficult to defend under panel review), we update nodes using simple, clear, and mathematically rigorous statistics:

### A. Mastery Update
The mastery score is the **weighted moving average** of the evaluations:
$$M_{new} = \frac{M_{old} \cdot N_{asked} + S_{eval}}{N_{asked} + 1}$$
*This represents a clear average of all scores achieved on this concept. No magic constants are used.*

### B. Confidence Update
Confidence is directly proportional to the amount of evidence collected relative to a maximum budget per concept ($N_{budget} = 3$):
$$C = \min\left(1.0, \frac{N_{asked}}{N_{budget}}\right)$$
*Example:* 
* Asked 1 question: $C = 1/3 \approx 33\%$ confidence.
* Asked 3 questions: $C = 3/3 = 100\%$ confidence.

---

## 6. Assessment Completion Engine

The interview session concludes when the **Assessment Completion Engine** detects we have reached the evidence budget, ensuring the interview is efficient and natural:

```javascript
function shouldStopInterview(interviewHistory, competencyGraph) {
    const totalQuestionsAsked = interviewHistory.length;
    
    // 1. Hard minimum baseline (e.g. 5 questions)
    if (totalQuestionsAsked < 5) {
        return false;
    }
    
    // 2. Hard maximum ceiling to prevent session fatigue
    if (totalQuestionsAsked >= 10) {
        return true;
    }
    
    // 3. Adaptive Early Stopping:
    // Check if all high-priority claims (Project & Skill nodes) have been explored
    const highPriorityNodes = competencyGraph.filter(node => node.weight >= 2);
    const allClaimsExplored = highPriorityNodes.every(node => node.questionsAsked > 0);
    
    if (allClaimsExplored) {
        return true; // We successfully verified all resume claims and baseline concepts
    }
    
    return false;
}
```
* **Concept Budget**: Every concept has a strict limit of $3$ questions. Once reached, the FSM transitions to `MOVE_ON` to prevent getting stuck on concepts where the candidate clearly lacks knowledge.
