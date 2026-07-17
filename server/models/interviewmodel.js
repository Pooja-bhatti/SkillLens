import mongoose from "mongoose";

// Sub-schema: individual question in an interview session
const questionsSchema = new mongoose.Schema({
    question: String,
    concept: String,        // Which concept this question tested (e.g. "ACID Transactions")
    fsmState: String,       // FSM state when this question was asked (EXPLORE/VERIFY/DEEP_DIVE/CLARIFY)
    difficulty: String,     // "easy" | "medium" | "hard"
    timeLimit: Number,
    mustHave: [String],     // Expected concept phrases used for semantic evaluation
    answer: String,         // Candidate's submitted answer text
    feedback: String,       // LLM human-readable feedback (10-15 words)
    semanticScore: {        // Score from Transformers.js embedding evaluation [0-1]
        type: Number,
        default: 0
    },
    score: {                // Final display score (0-10), derived from semanticScore * 10
        type: Number,
        default: 0
    },
    confidence: {           // Legacy: LLM confidence sub-score (0-10)
        type: Number,
        default: 0
    },
    communication: {        // Legacy: LLM communication sub-score (0-10)
        type: Number,
        default: 0
    },
    correctness: {          // Legacy: LLM correctness sub-score (0-10)
        type: Number,
        default: 0
    },
})

// Sub-schema: a node in the Competency Graph embedded inside each interview
const competencyNodeSchema = new mongoose.Schema({
    concept: String,        // e.g. "React and Frontend", "SQL and RDBMS"
    parent: String,         // e.g. "Resume Project", "Resume Skill", "Core CS"
    weight: {               // Priority: 3=project claim, 2=skill claim, 1=core CS topic
        type: Number,
        default: 1
    },
    mastery: {              // Weighted moving average of all scores on this concept [0.0-1.0]
        type: Number,
        default: 0
    },
    confidence: {           // questionsAsked / BUDGET (3), ranges [0.0-1.0]
        type: Number,
        default: 0
    },
    questionsAsked: {       // How many questions have been asked for this concept
        type: Number,
        default: 0
    },
    fsmState: {             // Current FSM state: EXPLORE|VERIFY|DEEP_DIVE|CLARIFY|MOVE_ON
        type: String,
        default: "EXPLORE"
    },
    evidence: [String],     // Audit log: ["Answered ACID correctly (82%)", "Failed Indexing (41%)"]
    lastAsked: Date,
}, { _id: false });         // No separate _id for embedded nodes

// Main interview document schema
const interviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    role: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        enum: ["HR", "Technical", "Coding"],
        required: true
    },
    resumeText: {
        type: String
    },
    // NEW: Embedded Competency Graph — array of concept nodes
    competencyNodes: [competencyNodeSchema],

    // Total questions asked across all concepts (used by Assessment Completion Engine)
    totalQuestionsAsked: {
        type: Number,
        default: 0
    },

    questions: [questionsSchema],
    finalScore: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["Incompleted", "completed"],
        default: "Incompleted",
    },
}, { timestamps: true })

const Interview = mongoose.model("Interview", interviewSchema);
export default Interview