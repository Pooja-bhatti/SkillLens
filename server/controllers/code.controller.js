// Code Execution Controller — Docker-Based Sandbox
// Runs candidate code in isolated Docker containers (Python 3, C++).
// No third-party API keys needed.

import Interview from "../models/interviewmodel.js";
import { runAllTestCases } from "../utils/dockerRunner.js";

/**
 * POST /api/code/execute
 * Body: { interviewId, questionIndex, code, language }
 *
 * Fetches test cases from the DB, runs candidate code in a Docker container
 * against each test case, and returns per-test results.
 */
export const executeCode = async (req, res) => {
    try {
        const { interviewId, questionIndex, code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({ message: "code and language are required" });
        }

        const supportedLanguages = ["python", "cpp"];
        if (!supportedLanguages.includes(language.toLowerCase())) {
            return res.status(400).json({
                message: `Unsupported language: ${language}. Supported: ${supportedLanguages.join(", ")}`
            });
        }

        // Fetch test cases from the interview document
        const interview = await Interview.findById(interviewId);
        if (!interview) return res.status(404).json({ message: "Interview not found" });

        const question = interview.questions[questionIndex];
        if (!question) return res.status(404).json({ message: "Question not found" });

        const testCases = question.testCases || [];
        if (testCases.length === 0) {
            return res.status(400).json({ message: "No test cases available for this question" });
        }

        // Run code against all test cases in Docker containers
        const result = await runAllTestCases(code, language.toLowerCase(), testCases);

        return res.status(200).json(result);

    } catch (error) {
        console.error("executeCode error:", error.message);
        return res.status(500).json({ message: `Code execution failed: ${error.message}` });
    }
};
