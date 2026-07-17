// Adaptive Interview Controller
// All routing/selection/stopping decisions are made by deterministic algorithms.
// The LLM is used ONLY for: (1) resume parsing, (2) question phrasing, (3) human feedback text.

import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouterservices.js";
import { evaluateAnswer } from "../services/embeddingService.js";
import { getNextFSMState, getStateDifficulty, getStrategyDescription } from "../services/fsmEngine.js";
import { selectNextConcept, updateCompetencyNode } from "../services/conceptSelector.js";
import { assessmentCompletion } from "../services/assessmentEngine.js";
import { buildNodesByMode } from "../data/conceptTree.js";
import User from "../models/usermodel.js";
import Interview from "../models/interviewmodel.js";

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: Resume Parser
// ─────────────────────────────────────────────────────────────────────────────

export const analyzResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume Required" });
        }
        const filepath = req.file.path;
        const fileBuffer = await fs.promises.readFile(filepath);
        const uint8Array = new Uint8Array(fileBuffer);

        // Extract text from PDF pages
        const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
        let resumeText = "";
        for (let pagenum = 1; pagenum <= pdf.numPages; pagenum++) {
            const page = await pdf.getPage(pagenum);
            const content = await page.getTextContent();
            resumeText += content.items.map(item => item.str).join(" ") + "\n";
        }
        resumeText = resumeText.replace(/\s+/g, " ").trim();

        // LLM: extract structured claim data from resume text
        const message = [
            {
                role: "system",
                content: `Extract structured data from resume.
                STRICT RULES:
                - No markdown, no backticks, no explanations
                - Output must start with { and end with }
                Return strictly JSON:
                {
                    "role": "string",
                    "experience": "string",
                    "projects": ["project description 1", "project description 2"],
                    "skills": ["skill1", "skill2"]
                }`
            },
            { role: "user", content: resumeText }
        ];
        const aiResponse = await askAi(message);
        const parsed = JSON.parse(aiResponse);
        fs.unlinkSync(filepath);
        res.json({
            role: parsed.role,
            experience: parsed.experience,
            projects: parsed.projects,
            skills: parsed.skills,
            resumeText
        });

    } catch (error) {
        console.log(error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Generate ONE question + must_have[] from LLM for a given concept/state
// ─────────────────────────────────────────────────────────────────────────────

async function generateOneQuestion(concept, fsmState, role, experience, resumeText, mode = "Technical") {
    let systemPrompt, userPrompt;

    // ── HR MODE: Behavioral / STAR questions ──────────────────────────────────
    if (mode === "HR") {
        systemPrompt = "You are a warm, experienced HR interviewer. Return only valid JSON as instructed.";
        userPrompt = `You are conducting an HR behavioral interview.

Candidate:
- Role Applied: ${role}
- Experience: ${experience}

Current Topic: ${concept}

Generate exactly 1 behavioral interview question about this topic.
The question should invite the candidate to share a real experience using the STAR method (Situation, Task, Action, Result).

Return STRICT JSON only:
{
  "question": "The behavioral question here (15-30 words, open-ended, starting with Tell me about, Describe a time, or How do you)",
  "must_have": ["specific situation described", "action taken by candidate", "measurable outcome or result", "lesson learned or growth"]
}

Rules:
- Do NOT ask technical or coding questions — only soft skills, behavior, attitude, and experience
- must_have should describe what a good answer would contain (not exact wording)
- Output ONLY valid JSON, no markdown, no explanation`;

    // ── CODING MODE: DSA / Algorithm problems ─────────────────────────────────
    } else if (mode === "Coding") {
        const difficulty = getStateDifficulty(fsmState);
        systemPrompt = "You are a technical interviewer testing algorithmic problem-solving. Return only valid JSON as instructed.";
        userPrompt = `You are conducting a coding/DSA interview.

Candidate:
- Role Applied: ${role}
- Experience: ${experience}

Current Topic: ${concept}
Difficulty: ${difficulty}

Generate exactly 1 coding problem question on this topic.

Return STRICT JSON only:
{
  "question": "Problem statement: clearly describe the problem in 20-40 words, include input/output format or example",
  "must_have": ["correct algorithm or approach identified", "time complexity mentioned", "edge cases considered", "working logic or pseudocode explained"]
}

Rules:
- The question must be a real algorithmic problem (not just theory)
- Ask the candidate to explain their approach, not write full code
- must_have describes what a strong verbal answer would cover
- Output ONLY valid JSON, no markdown, no explanation`;

    // ── TECHNICAL MODE: CS concepts / System design ───────────────────────────
    } else {
        const difficulty = getStateDifficulty(fsmState);
        const strategy   = getStrategyDescription(fsmState);
        systemPrompt = "You are a professional technical interviewer. Return only valid JSON as instructed.";
        userPrompt = `You are a professional technical interviewer.

Candidate Profile:
- Role: ${role}
- Experience: ${experience}
- Resume Context: ${resumeText ? resumeText.slice(0, 600) : "Not provided"}

Current Topic: ${concept}
Interview Strategy: ${strategy}
Difficulty Level: ${difficulty}

Generate exactly 1 interview question for this topic and return STRICT JSON only:
{
  "question": "The interview question here (15-25 words, ending with ?)",
  "must_have": ["key concept 1", "key concept 2", "key concept 3"]
}

Rules:
- must_have should contain 3-4 short phrases (5-10 words each) that a correct answer should semantically cover
- No markdown, no backticks, no explanation — output ONLY valid JSON
- The question must be a single sentence ending with a question mark`;
    }

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt  }
    ];

    const raw = await askAi(messages);

    // Parse JSON — with a fallback if LLM wraps in markdown
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
            parsed = JSON.parse(match[0]);
        } else {
            // Final fallback: treat raw as the question, no must_have
            parsed = {
                question: raw.trim().split("\n")[0],
                must_have: []
            };
        }
    }

    return {
        question: parsed.question || "Can you explain this concept in more detail?",
        must_have: Array.isArray(parsed.must_have) ? parsed.must_have : []
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 + 5: Generate Interview — Initialize Competency Graph + First Question
// ─────────────────────────────────────────────────────────────────────────────

export const generateQuestion = async (req, res) => {
    try {
        let { role, experience, mode, resumeText, projects, skills } = req.body;
        role = role?.trim();
        mode = mode?.trim();
        experience = experience?.trim();

        if (!role || !mode || !experience) {
            return res.status(400).json({ message: "role, experience and mode are required" });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(400).json({ message: "User not found" });
        if (user.credits < 50) return res.status(400).json({ message: "Not enough credits" });

        const safeResume = resumeText?.trim() || "";

        // MODULE 2: Build Competency Graph — mode-aware
        // HR → behavioral topics, Coding → DSA topics, Technical → resume + core CS
        const competencyNodes = buildNodesByMode(
            mode,
            Array.isArray(projects) ? projects : [],
            Array.isArray(skills) ? skills : []
        );

        // MODULE 4: Select first concept (highest weight, unexplored)
        const firstNode = selectNextConcept(competencyNodes);
        if (!firstNode) {
            return res.status(500).json({ message: "No concepts available to interview on" });
        }

        // MODULE 5: Generate first question (LLM phrasing only — mode-aware)
        const { question, must_have } = await generateOneQuestion(
            firstNode.concept, firstNode.fsmState, role, experience, safeResume, mode
        );

        // Deduct credits and save interview
        user.credits -= 50;
        await user.save();

        const interview = await Interview.create({
            userId: user._id,
            role,
            experience,
            mode,
            resumeText: safeResume,
            competencyNodes,
            totalQuestionsAsked: 0,
            questions: [{
                question,
                concept: firstNode.concept,
                fsmState: firstNode.fsmState,
                difficulty: firstNode.fsmState === "EXPLORE" ? "easy" : "medium",
                timeLimit: 60,
                mustHave: must_have
            }]
        });

        res.json({
            interviewId: interview._id,
            creditsLeft: user.credits,
            userName: user.name,
            mode: interview.mode,                    // ← needed by frontend to show correct UI
            questions: interview.questions,           // first question only
            competencyNodes: interview.competencyNodes,
        });

    } catch (error) {
        console.error("generateQuestion error:", error);
        return res.status(500).json({ message: `Failed to create interview: ${error.message}` });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6 + 7 + 3 + 4: Submit Answer — Evaluate, Update Graph, Next Question
// ─────────────────────────────────────────────────────────────────────────────

export const submitAnswer = async (req, res) => {
    try {
        const { interviewId, questionIndex, answer, timeTaken } = req.body;
        const interview = await Interview.findById(interviewId);
        if (!interview) return res.status(404).json({ message: "Interview not found" });

        const question = interview.questions[questionIndex];
        if (!question) return res.status(404).json({ message: "Question not found" });

        // ── Handle empty or timed-out answers ──
        if (!answer || answer.trim() === "") {
            question.score = 0;
            question.feedback = "You did not submit an answer.";
            question.answer = "";
            question.semanticScore = 0;
            interview.totalQuestionsAsked += 1;
            interview.markModified('questions');
            await interview.save();
            return res.json({ feedback: question.feedback, done: false, nextQuestion: null });
        }

        if (timeTaken > question.timeLimit) {
            question.score = 0;
            question.feedback = "Time limit exceeded. Answer not evaluated.";
            question.answer = answer;
            question.semanticScore = 0;
            interview.totalQuestionsAsked += 1;
            interview.markModified('questions');
            await interview.save();
            return res.json({ feedback: question.feedback, done: false, nextQuestion: null });
        }

        // ── MODULE 6: Semantic Evaluation (Transformers.js) ──
        const mustHave = question.mustHave || [];
        const semanticScore = await evaluateAnswer(answer.trim(), mustHave);
        console.log(`[FSM] concept="${question.concept}" score=${semanticScore.toFixed(3)} fsmState="${question.fsmState}"`);

        // ── LLM: Get human-readable feedback text (UX only — not used for grading) ──
        let feedbackText = "Good effort. Keep building on your understanding.";
        try {
            const feedbackMessages = [
                {
                    role: "system",
                    content: `You are a professional interviewer giving feedback.
Write exactly 1 sentence of natural feedback (10-15 words).
Be specific to the answer. Sound human and professional.
Return ONLY valid JSON: {"feedback": "your feedback here"}`
                },
                {
                    role: "user",
                    content: `Question: ${question.question}\nAnswer: ${answer}\nScore: ${Math.round(semanticScore * 10)}/10`
                }
            ];
            const fbRaw = await askAi(feedbackMessages);
            const fbParsed = JSON.parse(fbRaw.match(/\{[\s\S]*\}/)?.[0] || fbRaw);
            feedbackText = fbParsed.feedback || feedbackText;
        } catch { /* silently use default feedback */ }

        // ── Update question record ──
        question.answer = answer;
        question.semanticScore = semanticScore;
        question.score = Math.round(semanticScore * 10); // [0-10] for display
        question.feedback = feedbackText;
        // Legacy sub-scores approximated from semantic score for backward compat with Step3Report
        question.confidence = Math.round(semanticScore * 10);
        question.communication = Math.min(10, Math.round((answer.trim().split(/\s+/).length / 25) * 10));
        question.correctness = Math.round(semanticScore * 10);

        // ── MODULE 7: Update Competency Graph Node ──
        const conceptName = question.concept;
        const nodeIndex = interview.competencyNodes.findIndex(n => n.concept === conceptName);
        let nextFsmState = "MOVE_ON";

        if (nodeIndex !== -1) {
            const node = interview.competencyNodes[nodeIndex];
            nextFsmState = getNextFSMState(node.fsmState, semanticScore);
            const evidenceStr = semanticScore >= 0.8
                ? `✓ Answered "${conceptName}" correctly (${Math.round(semanticScore * 100)}%)`
                : `✗ Struggled with "${conceptName}" (${Math.round(semanticScore * 100)}%)`;
            updateCompetencyNode(node, semanticScore, evidenceStr, nextFsmState);
        }

        interview.totalQuestionsAsked += 1;

        // ── MODULE 3 (Completion Check) → MODULE 4 (Next Concept) → MODULE 5 (Next Question) ──
        const { stop, reason } = assessmentCompletion(
            interview.totalQuestionsAsked,
            interview.competencyNodes
        );

        let nextQuestion = null;

        if (!stop) {
            // Find the next concept to ask about
            // If FSM says MOVE_ON → selectNextConcept picks the next highest-priority node
            // Otherwise, continue on the same concept with the updated FSM state
            let targetNode;
            if (nextFsmState === "MOVE_ON") {
                targetNode = selectNextConcept(interview.competencyNodes);
            } else {
                // Continue on same concept with updated state
                targetNode = interview.competencyNodes[nodeIndex] || selectNextConcept(interview.competencyNodes);
            }

            if (targetNode) {
                const { question: nextQ, must_have: nextMH } = await generateOneQuestion(
                    targetNode.concept,
                    targetNode.fsmState,
                    interview.role,
                    interview.experience,
                    interview.resumeText,
                    interview.mode          // ← pass mode so HR/Coding/Technical stay consistent
                );

                const timeLimits = { EXPLORE: 60, VERIFY: 90, DEEP_DIVE: 120, CLARIFY: 60 };
                const difficultyMap = { EXPLORE: "easy", VERIFY: "medium", DEEP_DIVE: "hard", CLARIFY: "easy" };

                const newQuestionDoc = {
                    question: nextQ,
                    concept: targetNode.concept,
                    fsmState: targetNode.fsmState,
                    difficulty: difficultyMap[targetNode.fsmState] || "medium",
                    timeLimit: timeLimits[targetNode.fsmState] || 90,
                    mustHave: nextMH
                };

                interview.questions.push(newQuestionDoc);
                nextQuestion = newQuestionDoc;
            }
        }

        // CRITICAL: Mongoose does not auto-detect direct property mutations on
        // embedded subdocument arrays. We must explicitly mark them as modified
        // so that fsmState, mastery, questionsAsked etc. are persisted to MongoDB.
        interview.markModified('competencyNodes');
        interview.markModified('questions');

        await interview.save();

        return res.status(200).json({
            feedback: feedbackText,
            semanticScore: Math.round(semanticScore * 100), // percentage for display
            score: Math.round(semanticScore * 10),
            nextQuestion,
            done: stop || !nextQuestion,
            stopReason: reason,
            competencyNodes: interview.competencyNodes,
        });

    } catch (error) {
        console.error("submitAnswer error:", error);
        return res.status(500).json({ message: `Failed to submit answer: ${error.message}` });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 9: Finish Interview — Aggregate Scores + Final Competency Report
// ─────────────────────────────────────────────────────────────────────────────

export const finishInterview = async (req, res) => {
    try {
        const { interviewId } = req.body;
        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return res.status(400).json({ message: "Interview not found" });
        }

        const totalQuestion = interview.questions.length;
        let totalscore = 0, totalconfidence = 0, totalcommunication = 0, totalcorrectness = 0;

        interview.questions.forEach(element => {
            totalscore       += element.score || 0;
            totalconfidence  += element.confidence || 0;
            totalcommunication += element.communication || 0;
            totalcorrectness += element.correctness || 0;
        });

        const finalScore       = totalQuestion ? totalscore / totalQuestion : 0;
        const avgConfidence    = totalQuestion ? totalconfidence / totalQuestion : 0;
        const avgCommunication = totalQuestion ? totalcommunication / totalQuestion : 0;
        const avgCorrectness   = totalQuestion ? totalcorrectness / totalQuestion : 0;

        interview.finalScore = finalScore;
        interview.status = "completed";
        await interview.save();

        return res.status(200).json({
            finalScore: Number(finalScore.toFixed(1)),
            confidence: Number(avgConfidence.toFixed(1)),
            communication: Number(avgCommunication.toFixed(1)),
            correctness: Number(avgCorrectness.toFixed(1)),
            questionWiseScore: interview.questions.map(q => ({
                question: q.question,
                concept: q.concept || "General",
                fsmState: q.fsmState || "EXPLORE",
                score: q.score || 0,
                semanticScore: q.semanticScore || 0,
                feedback: q.feedback || "",
                confidence: q.confidence || 0,
                communication: q.communication || 0,
                correctness: q.correctness || 0,
            })),
            role: interview.role,
            experience: interview.experience,
            mode: interview.mode,
            competencyNodes: interview.competencyNodes,
            totalQuestionsAsked: interview.totalQuestionsAsked,
        });

    } catch (error) {
        return res.status(500).json({ message: `Error finishing interview: ${error.message}` });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 10: Interview History — All past interviews + study recommendations
// ─────────────────────────────────────────────────────────────────────────────

export const getHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const interviews = await Interview.find({ userId })
            .sort({ createdAt: -1 }) // newest first
            .lean();

        // Build per-interview summary cards
        const historySummaries = interviews.map((iv) => {
            const totalQ = iv.questions?.length || 0;
            const answered = iv.questions?.filter(q => q.answer && q.answer.trim()).length || 0;
            const avgScore = totalQ > 0
                ? iv.questions.reduce((sum, q) => sum + (q.score || 0), 0) / totalQ
                : 0;

            // Collect topics with mastery < 0.5 as weak areas
            const weakAreas = (iv.competencyNodes || [])
                .filter(n => n.questionsAsked > 0 && n.mastery < 0.7)
                .map(n => ({ concept: n.concept, mastery: Math.round(n.mastery * 100) }));

            // Collect topics with mastery >= 0.7 as strong areas
            const strongAreas = (iv.competencyNodes || [])
                .filter(n => n.questionsAsked > 0 && n.mastery >= 0.7)
                .map(n => ({ concept: n.concept, mastery: Math.round(n.mastery * 100) }));

            return {
                _id: iv._id,
                role: iv.role,
                experience: iv.experience,
                mode: iv.mode,
                status: iv.status,
                finalScore: iv.finalScore || Number(avgScore.toFixed(1)),
                totalQuestions: totalQ,
                answered,
                createdAt: iv.createdAt,
                weakAreas,
                strongAreas,
            };
        });

        // ── Aggregate study recommendations across ALL interviews ──
        // Collect every weak concept across all sessions, deduplicate, and rank by how
        // many interviews it appeared weak in (frequency = more important to study)
        const weakMap = new Map(); // concept → { count, worstMastery }
        for (const iv of interviews) {
            for (const node of (iv.competencyNodes || [])) {
                if (node.questionsAsked > 0 && node.mastery < 0.7) {
                    const existing = weakMap.get(node.concept);
                    if (!existing) {
                        weakMap.set(node.concept, {
                            concept: node.concept,
                            count: 1,
                            worstMastery: Math.round(node.mastery * 100),
                            mode: iv.mode,
                        });
                    } else {
                        existing.count += 1;
                        existing.worstMastery = Math.min(existing.worstMastery, Math.round(node.mastery * 100));
                    }
                }
            }
        }

        // Sort: most-frequent weakness first, then lowest mastery
        const recommendations = Array.from(weakMap.values())
            .sort((a, b) => b.count - a.count || a.worstMastery - b.worstMastery)
            .slice(0, 10); // top 10 recommendations

        // ── Aggregate ALL subject scores across ALL interviews ──
        // Include every concept from questions AND competencyNodes, even unanswered
        const allConceptsMap = new Map();

        for (const iv of interviews) {
            // Source 1: All questions (answered or not)
            for (const q of (iv.questions || [])) {
                if (q.concept) {
                    const answered = q.answer && q.answer.trim();
                    const score = answered
                        ? (q.semanticScore != null ? Math.round(q.semanticScore * 100) : (q.score != null ? q.score * 10 : 0))
                        : 0;
                    const existing = allConceptsMap.get(q.concept);
                    if (!existing) {
                        allConceptsMap.set(q.concept, {
                            concept: q.concept,
                            mastery: score,
                            bestMastery: score,
                            totalAsked: 1,
                            answered: answered ? 1 : 0,
                            sessions: 1,
                            _sessionIds: new Set([String(iv._id)]),
                        });
                    } else {
                        existing.bestMastery = Math.max(existing.bestMastery, score);
                        existing.mastery = existing.bestMastery;
                        existing.totalAsked += 1;
                        if (answered) existing.answered += 1;
                        if (!existing._sessionIds.has(String(iv._id))) {
                            existing.sessions += 1;
                            existing._sessionIds.add(String(iv._id));
                        }
                    }
                }
            }

            // Source 2: ALL CompetencyNodes (covers subjects that were in the graph but never reached as questions)
            for (const node of (iv.competencyNodes || [])) {
                if (!allConceptsMap.has(node.concept)) {
                    const score = node.questionsAsked > 0 ? Math.round(node.mastery * 100) : 0;
                    allConceptsMap.set(node.concept, {
                        concept: node.concept,
                        mastery: score,
                        bestMastery: score,
                        totalAsked: node.questionsAsked || 0,
                        answered: node.questionsAsked > 0 ? node.questionsAsked : 0,
                        sessions: 1,
                        _sessionIds: new Set([String(iv._id)]),
                    });
                }
            }
        }

        // Clean up internal tracking field before sending response
        const competencyScores = Array.from(allConceptsMap.values())
            .map(({ _sessionIds, ...rest }) => rest)
            .sort((a, b) => b.mastery - a.mastery); // highest mastery first

        // ── Overall statistics ──
        const completedInterviews = interviews.filter(iv => iv.status === 'completed');
        const overallAvg = completedInterviews.length > 0
            ? completedInterviews.reduce((s, iv) => s + (iv.finalScore || 0), 0) / completedInterviews.length
            : 0;

        return res.status(200).json({
            interviews: historySummaries,
            recommendations,
            competencyScores,
            stats: {
                totalInterviews: interviews.length,
                completed: completedInterviews.length,
                overallAvgScore: Number(overallAvg.toFixed(1)),
            },
        });

    } catch (error) {
        console.error("getHistory error:", error);
        return res.status(500).json({ message: `Error fetching history: ${error.message}` });
    }
};