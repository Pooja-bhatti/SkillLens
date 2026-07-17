// CSE Concept Tree — Static domain hierarchy for Competency Graph initialization
// Weight rules:
//   3 = concept extracted from a resume PROJECT (highest priority, verify the claim)
//   2 = concept extracted from a resume SKILL list (declared skill, verify it)
//   1 = core CS topic not explicitly claimed (baseline coverage)

// ─── HR Behavioral Topics ────────────────────────────────────────────────────
export const HR_CONCEPT_TREE = {
    "Self & Background":     ["Tell me about yourself", "Career journey and motivation", "Greatest professional achievement", "Why this role and company"],
    "Strengths & Weaknesses": ["Core strengths in the workplace", "Areas of improvement and self-awareness", "How you handle constructive feedback", "Learning from past mistakes"],
    "Teamwork & Collaboration": ["Working in a team environment", "Handling disagreement with a colleague", "Supporting a team member in difficulty", "Cross-functional collaboration"],
    "Leadership & Initiative": ["Taking initiative without being asked", "Leading a project or team", "Influencing without authority", "Motivating others around you"],
    "Handling Pressure & Conflict": ["Managing tight deadlines", "Handling stressful situations", "Resolving conflict with a manager", "Dealing with failure or setbacks"],
    "Career Goals & Fit": ["Where you see yourself in 5 years", "Why you are leaving your current role", "What excites you about this opportunity", "Long-term career aspirations"],
};

// ─── Coding / DSA Topics ─────────────────────────────────────────────────────
export const CODING_CONCEPT_TREE = {
    "Arrays and Strings":          ["Two Sum and variants", "Sliding Window technique", "String reversal and anagram detection", "Prefix sums and subarray problems"],
    "Linked Lists":                ["Reverse a linked list", "Detect and remove cycle", "Merge two sorted linked lists", "Find middle of linked list"],
    "Trees and BST":               ["Binary tree traversals", "Height and diameter of tree", "Lowest common ancestor", "Validate BST"],
    "Graphs":                      ["BFS and DFS traversal", "Detect cycle in directed graph", "Shortest path algorithms", "Number of islands problem"],
    "Dynamic Programming":         ["Fibonacci and memoization", "0/1 Knapsack problem", "Longest common subsequence", "Coin change problem"],
    "Stack and Queue":             ["Valid parentheses matching", "Next greater element", "Implement queue using stacks", "Min stack design"],
    "Sorting and Searching":       ["Binary search variants", "Merge sort implementation", "Quick sort and pivot selection", "Search in rotated sorted array"],
    "Recursion and Backtracking":  ["Permutations and combinations", "N-Queens problem", "Subset sum problem", "Word search in grid"],
    "Hash Maps and Sets":          ["Two sum using hash map", "Group anagrams together", "Longest consecutive sequence", "Top K frequent elements"],
    "Two Pointers":                ["Container with most water", "Three sum problem", "Remove duplicates from sorted array", "Palindrome check with two pointers"],
};

export const CSE_CONCEPT_TREE = {
    DBMS: {
        parent: "Core CS",
        concepts: [
            "ER Model and Relationships",
            "Normalization and Normal Forms",
            "SQL Queries and Joins",
            "Transactions and ACID Properties",
            "Indexing and Query Optimization",
            "NoSQL vs SQL Databases",
        ],
    },
    "Operating Systems": {
        parent: "Core CS",
        concepts: [
            "Processes and Threads",
            "CPU Scheduling Algorithms",
            "Memory Management and Paging",
            "Virtual Memory and Page Faults",
            "Deadlocks Detection and Prevention",
            "Semaphores and Mutex",
        ],
    },
    "Computer Networks": {
        parent: "Core CS",
        concepts: [
            "OSI vs TCP/IP Model",
            "TCP vs UDP Protocol Differences",
            "HTTP and HTTPS and WebSockets",
            "DNS Resolution Process",
            "Routing Algorithms",
            "Load Balancing Strategies",
        ],
    },
    "Data Structures and Algorithms": {
        parent: "Core CS",
        concepts: [
            "Arrays and Linked Lists",
            "Trees and Binary Search Trees",
            "Graph Traversal BFS and DFS",
            "Sorting and Searching Algorithms",
            "Dynamic Programming",
            "Time and Space Complexity Analysis",
        ],
    },
    "System Design": {
        parent: "Core CS",
        concepts: [
            "Scalability and Horizontal Scaling",
            "Caching Strategies and Redis",
            "Message Queues and Event-Driven Architecture",
            "CAP Theorem and Consistency Models",
            "Microservices vs Monolithic Architecture",
            "REST API Design Principles",
        ],
    },
};

// Keyword map: if a skill or project contains any of these keywords,
// it maps to the corresponding concept domain
export const SKILL_KEYWORD_MAP = [
    { keywords: ["react", "vue", "angular", "next", "frontend", "jsx", "redux", "tailwind", "css", "html"], domain: "React and Frontend" },
    { keywords: ["node", "express", "backend", "api", "server", "rest", "graphql", "fastapi", "flask", "django"], domain: "Node.js and Backend" },
    { keywords: ["mongo", "mongodb", "nosql", "mongoose", "firestore", "dynamodb"], domain: "MongoDB and NoSQL" },
    { keywords: ["sql", "mysql", "postgres", "postgresql", "sqlite", "database", "db", "rdbms", "prisma", "sequelize"], domain: "SQL and RDBMS" },
    { keywords: ["jwt", "auth", "oauth", "cookie", "session", "passport", "firebase auth", "authentication"], domain: "Authentication and JWT" },
    { keywords: ["docker", "kubernetes", "k8s", "devops", "ci/cd", "github actions", "jenkins", "deployment"], domain: "DevOps and Docker" },
    { keywords: ["redis", "cache", "caching", "memcached"], domain: "Caching and Redis" },
    { keywords: ["socket", "websocket", "real-time", "realtime", "socket.io"], domain: "WebSockets and Real-Time" },
    { keywords: ["python", "machine learning", "ml", "ai", "tensorflow", "pytorch", "sklearn", "pandas", "numpy"], domain: "Python and Machine Learning" },
    { keywords: ["java", "spring", "springboot"], domain: "Java and Spring Boot" },
    { keywords: ["aws", "azure", "gcp", "cloud", "lambda", "s3", "ec2"], domain: "Cloud and AWS" },
    { keywords: ["git", "github", "version control"], domain: "Git and Version Control" },
    { keywords: ["os", "operating system", "linux", "unix", "kernel"], domain: "Operating Systems" },
    { keywords: ["network", "networking", "tcp", "http", "dns"], domain: "Computer Networks" },
    { keywords: ["dbms", "transactions", "acid", "normalization", "indexing"], domain: "DBMS" },
    { keywords: ["dsa", "algorithm", "data structure", "leetcode", "competitive"], domain: "Data Structures and Algorithms" },
    { keywords: ["system design", "architecture", "microservices", "scalability"], domain: "System Design" },
];

/**
 * Build competency nodes from resume data.
 * Projects get weight 3, skills get weight 2, unfilled core CS topics get weight 1.
 *
 * @param {string[]} projects - list of project descriptions from resume
 * @param {string[]} skills   - list of skill names from resume
 * @returns {Object[]}        - array of competency node objects
 */
export function buildCompetencyNodes(projects = [], skills = []) {
    const nodes = new Map(); // key: concept name, value: node object

    // Helper: add or upgrade a node
    const upsertNode = (concept, parent, weight) => {
        const existing = nodes.get(concept);
        if (!existing || existing.weight < weight) {
            nodes.set(concept, {
                concept,
                parent,
                weight,
                mastery: 0,
                confidence: 0,
                questionsAsked: 0,
                fsmState: "EXPLORE",
                evidence: [],
                lastAsked: null,
            });
        }
    };

    // Map projects (weight 3)
    for (const project of projects) {
        const lower = project.toLowerCase();
        for (const { keywords, domain } of SKILL_KEYWORD_MAP) {
            if (keywords.some(kw => lower.includes(kw))) {
                upsertNode(domain, "Resume Project", 3);
                break;
            }
        }
    }

    // Map skills (weight 2)
    for (const skill of skills) {
        const lower = skill.toLowerCase();
        for (const { keywords, domain } of SKILL_KEYWORD_MAP) {
            if (keywords.some(kw => lower.includes(kw))) {
                upsertNode(domain, "Resume Skill", 2);
                break;
            }
        }
    }

    // Fill in core CS topics with weight 1 (if not already added with higher weight)
    for (const [domain, { parent, concepts }] of Object.entries(CSE_CONCEPT_TREE)) {
        // Add domain level node if not present
        if (!nodes.has(domain)) {
            upsertNode(domain, parent, 1);
        }
    }

    return Array.from(nodes.values());
}

/**
 * Build competency nodes for HR interview mode.
 * All nodes are behavioral topics with equal weight 2 (all important).
 */
export function buildHRNodes() {
    const nodes = [];
    for (const [category, topics] of Object.entries(HR_CONCEPT_TREE)) {
        // Shuffle topics within each category for unpredictability
        const shuffled = [...topics].sort(() => Math.random() - 0.5);
        // Add the first topic of each category as a node (we go breadth-first across categories)
        nodes.push({
            concept: shuffled[0],
            parent: category,
            weight: 2,
            mastery: 0,
            confidence: 0,
            questionsAsked: 0,
            fsmState: "EXPLORE",
            evidence: [],
            lastAsked: null,
        });
        // Add remaining topics with weight 1 (lower priority)
        for (let i = 1; i < shuffled.length; i++) {
            nodes.push({
                concept: shuffled[i],
                parent: category,
                weight: 1,
                mastery: 0,
                confidence: 0,
                questionsAsked: 0,
                fsmState: "EXPLORE",
                evidence: [],
                lastAsked: null,
            });
        }
    }
    return nodes;
}

/**
 * Build competency nodes for Coding interview mode.
 * DSA topics with equal weight — randomize order within topics.
 */
export function buildCodingNodes() {
    const domains = Object.keys(CODING_CONCEPT_TREE);
    // Shuffle domain order for unpredictability
    const shuffled = [...domains].sort(() => Math.random() - 0.5);
    return shuffled.map((domain) => ({
        concept: domain,
        parent: "DSA",
        weight: 1,
        mastery: 0,
        confidence: 0,
        questionsAsked: 0,
        fsmState: "EXPLORE",
        evidence: [],
        lastAsked: null,
    }));
}

/**
 * Mode-aware factory — returns the correct node builder based on interview mode.
 * @param {string} mode     - "Technical" | "HR" | "Coding"
 * @param {string[]} projects
 * @param {string[]} skills
 */
export function buildNodesByMode(mode, projects = [], skills = []) {
    if (mode === "HR")     return buildHRNodes();
    if (mode === "Coding") return buildCodingNodes();
    return buildCompetencyNodes(projects, skills); // Technical (default)
}
