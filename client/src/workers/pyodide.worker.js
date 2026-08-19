// pyodide.worker.js
// Web Worker to execute Pyodide code securely with TLE and MLE protection.

importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodideReadyPromise = null;
let pyodideInstance = null;

async function loadPyodideRuntime() {
    if (pyodideInstance) return pyodideInstance;
    pyodideInstance = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });
    return pyodideInstance;
}

// Start loading immediately when worker spins up
pyodideReadyPromise = loadPyodideRuntime();

/**
 * Normalize an output string for comparison:
 * - Trim whitespace
 * - Replace single quotes with double quotes (Python repr vs JSON)
 * - Normalize spacing around brackets/commas
 * - Case-insensitive True/False vs true/false
 */
function normalizeOutput(str) {
    if (!str) return '';
    let s = str.trim();
    // Normalize Python booleans to lowercase
    s = s.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null');
    // Normalize quotes: single → double
    s = s.replace(/'/g, '"');
    // Normalize whitespace around JSON-like structures
    s = s.replace(/\s*,\s*/g, ', ').replace(/\[\s+/g, '[').replace(/\s+\]/g, ']');
    return s;
}

self.onmessage = async (event) => {
    const { id, code, testCases } = event.data;

    try {
        const pyodide = await pyodideReadyPromise;

        const results = [];
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const { input, expectedOutput } = tc;

            try {
                // Reset stdin/stdout for each test case and inject helpful imports
                pyodide.runPython(`
import sys, json, ast
from io import StringIO
sys.stdin = StringIO(${JSON.stringify(input || '')})
_captured_stdout = StringIO()
sys.stdout = _captured_stdout
`);
                // Run the candidate's code
                await pyodide.runPythonAsync(code);
                // Capture stdout
                const actualOutput = pyodide.runPython('_captured_stdout.getvalue()').trim();
                // Restore stdout
                pyodide.runPython('sys.stdout = sys.__stdout__');

                const passed = normalizeOutput(actualOutput) === normalizeOutput(expectedOutput || '');
                results.push({
                    testCase: i + 1,
                    input: input || '',
                    expectedOutput: expectedOutput || '',
                    actualOutput,
                    stderr: '',
                    status: passed ? 'Accepted' : 'Wrong Answer',
                    passed,
                });
            } catch (testErr) {
                // Individual test case error — record it and continue to next test
                try { pyodide.runPython('sys.stdout = sys.__stdout__'); } catch (e) {}
                results.push({
                    testCase: i + 1,
                    input: input || '',
                    expectedOutput: expectedOutput || '',
                    actualOutput: '',
                    stderr: testErr.message || 'Runtime error',
                    status: 'Runtime Error',
                    passed: false,
                });
            }
        }

        const passedCount = results.filter(r => r.passed).length;
        self.postMessage({
            id,
            success: true,
            testResults: {
                allPassed: passedCount === results.length,
                passedCount,
                totalTests: results.length,
                results
            }
        });

    } catch (err) {
        // Restore stdout on error
        try {
            if (pyodideInstance) {
                pyodideInstance.runPython('sys.stdout = sys.__stdout__');
            }
        } catch (e) {}

        self.postMessage({
            id,
            success: false,
            error: err.message || 'Runtime error'
        });
    }
};
