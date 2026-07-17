# InterviewIQ — Adaptive AI Competency Assessment Platform

> An algorithm-driven mock interview system for Software Engineering candidates.  
> The LLM only **phrases questions**. Every decision about *what to ask*, *how hard*, and *when to stop* is made by deterministic algorithms.

---

## 🗂️ Table of Contents
1. [Project Goal](#-project-goal)
2. [Current Status (What is Built)](#-current-status-what-is-built)
3. [Target Architecture (Where We're Going)](#-target-architecture)
4. [Tech Stack](#-tech-stack)
5. [Database Schemas (Full Detail)](#-database-schemas)
6. [API Endpoints](#-api-endpoints)
7. [Algorithms Used](#-algorithms-used)
8. [Data Graphs & Competency Structures](#-data-graphs--competency-structures)
9. [ML Evaluation Engine](#-ml-evaluation-engine)
10. [Detailed Docs](#-detailed-documentation)

---

## 🎯 Project Goal

> **Estimate a candidate's competency across core Computer Science concepts and dynamically conduct an interview to maximize confidence in that assessment.**

The system is NOT a chatbot. It is a **Competency Assessment Engine** that happens to use an LLM only as a natural language phrasing tool.

---

## ✅ Current Status (What is Built)

The following modules are **fully implemented and working**:

| Module | Status | Description |
|---|---|---|
| Google Authentication (Firebase) | ✅ Done | Sign in with Google, JWT stored in cookie + localStorage |
| User Session Management | ✅ Done | Redux state, persistent login across refreshes |
| Credit System | ✅ Done | Users start with 1000 credits, each interview costs 50 |
| Resume Upload & PDF Parser | ✅ Done | `pdfjs-dist` extracts text from uploaded PDF |
| Resume Claim Extractor (LLM) | ✅ Done | LLM parses resume text → structured JSON (role, experience, projects[], skills[]) |
| Step 1 — Interview Setup UI | ✅ Done | Role, experience, mode (HR/Technical), resume upload |
| Step 2 — Live Interview Room | ✅ Done | Web Speech API (voice input + TTS), countdown timer, answer submission |
| Step 3 — Score Report | ✅ Done | SVG progress rings, per-question feedback, confidence/communication/correctness breakdown |
| LLM Question Generation | ✅ Done (basic) | 5 questions generated upfront via OpenRouter → `gpt-4o-mini` |
| LLM Answer Scoring | ✅ Done (basic) | LLM scores each answer (0-10) for confidence, communication, correctness |
| MongoDB Persistence | ✅ Done | All interviews, questions, answers, scores stored in Atlas |

### What the current model does NOT do:
- ❌ No Competency Graph (flat score only, no topic tracking)
- ❌ No FSM strategy transitions (static difficulty 1→5)
- ❌ No semantic embeddings (LLM grades answers, not math)
- ❌ No adaptive next-question generation (all 5 pregenerated)
- ❌ No concept priority weighting (all topics equal)

---

## 🏗️ Target Architecture

```
                                 Resume Upload
                                       │
                                       ▼
                           Resume Claim Extractor (LLM)
                    → outputs: role, experience, projects[], skills[]
                                       │
                                       ▼
                       Competency Graph Initialization
                  (Priority Weights: Project=3, Skill=2, CS=1)
                                       │
                                       ▼
                          Concept Selection Engine
                  (Picks highest-weight unexplored concept)
                                       │
                                       ▼
                           Interview Strategy FSM
              (EXPLORE → VERIFY → DEEP_DIVE | CLARIFY → MOVE_ON)
                                       │
                                       ▼
                     LLM Question Generation (phrasing only)
                  → outputs: {question, must_have[], concept}
                                       │
                                       ▼
              Candidate Response (Voice / Text — Step 2 UI)
                                       │
                                       ▼
                          Semantic Answer Evaluation
                  (Transformers.js all-MiniLM-L6-v2 ONNX)
              → Average Cosine Similarity vs must_have[] phrases
                                       │
                                       ▼
                     Competency Graph Node Update
          (Moving Average Mastery + Evidence Log + Confidence)
                                       │
                                       ▼
                       Assessment Completion Engine
              (Min 5 Qs + All claims verified OR Max 10 Qs)
                                       │
                                       ▼
                          Final Hiring Report
              (Competency bars, evidence logs, learning path)
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Redux Toolkit | Global state (user auth + credits) |
| Axios | HTTP calls to backend |
| Web Speech API | Voice input (speech-to-text) + TTS output |
| SVG / CSS | Competency ring charts in Step 3 Report |
| React Router DOM | Page routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server (port 8000) |
| MongoDB Atlas | Cloud database |
| Mongoose | Schema/model definitions |
| Cookie Parser | JWT cookie handling |
| Multer | Resume PDF file upload handling |
| `pdfjs-dist` | PDF text extraction |
| `jsonwebtoken` | Auth token signing/verification |
| CORS + dotenv | Server config |

### AI / ML
| Technology | Purpose |
|---|---|
| OpenRouter API (`gpt-4o-mini`) | LLM for question phrasing + resume parsing |
| Firebase Auth | Google OAuth popup flow |
| **Transformers.js** *(planned)* | `all-MiniLM-L6-v2` ONNX for semantic answer evaluation |

---

## 🗄️ Database Schemas

### 1. `users` Collection

```javascript
{
  _id: ObjectId,          // MongoDB auto-generated
  name: String,           // From Google OAuth display name
  email: String,          // Unique — Google account email
  credits: Number,        // Default: 1000. Deducts 50 per interview
  createdAt: Date,        // Auto-managed by Mongoose timestamps
  updatedAt: Date
}
```

### 2. `interviews` Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // Reference → users._id
  role: String,           // e.g. "Software Engineer"
  experience: String,     // e.g. "2 years"
  mode: String,           // Enum: ["HR", "Technical"]
  resumeText: String,     // Full extracted PDF text
  finalScore: Number,     // Default: 0. Set on /finish
  status: String,         // Enum: ["Incompleted", "completed"]
  questions: [            // Array of question sub-documents
    {
      question: String,       // The question text
      difficulty: String,     // "easy" | "medium" | "hard"
      timeLimit: Number,      // Seconds (60 | 90 | 120)
      answer: String,         // Candidate's submitted answer text
      feedback: String,       // LLM feedback (10-15 words)
      score: Number,          // Final score for this Q (0-10)
      confidence: Number,     // Sub-score: confidence (0-10)
      communication: Number,  // Sub-score: communication (0-10)
      correctness: Number,    // Sub-score: correctness (0-10)
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### 3. `competencyNodes` Collection *(planned — to implement)*

```javascript
{
  _id: ObjectId,
  interviewId: ObjectId,      // Reference → interviews._id
  userId: ObjectId,           // Reference → users._id
  concept: String,            // e.g. "ACID Transactions"
  parent: String,             // e.g. "DBMS" (for hierarchy display)
  weight: Number,             // Priority: 3=project claim, 2=skill claim, 1=core CS
  mastery: Number,            // Moving average score [0.0-1.0]
  confidence: Number,         // questionsAsked / budget (max 3)
  questionsAsked: Number,     // Number of Qs asked on this concept
  fsmState: String,           // Current FSM state: EXPLORE|VERIFY|DEEP_DIVE|CLARIFY|MOVE_ON
  evidence: [String],         // e.g. ["Answered ACID correctly (82%)", "Failed Indexing (41%)"]
  lastAsked: Date
}
```

---

## 📡 API Endpoints

### Auth Routes (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/google` | ❌ | Google OAuth login — creates/finds user, sets JWT cookie |
| GET | `/logout` | ✅ | Clears JWT cookie |

### User Routes (`/api/user`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/current-user` | ✅ | Returns logged-in user document |

### Interview Routes (`/api/interview`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/resume` | ✅ | Uploads PDF, extracts text, calls LLM to parse resume JSON |
| POST | `/generate-questions` | ✅ | Generates 5 interview questions, creates interview in DB, deducts 50 credits |
| POST | `/submit-answer` | ✅ | Saves candidate answer, calls LLM to score it (confidence, communication, correctness) |
| POST | `/finish` | ✅ | Aggregates all scores, updates interview status to "completed", returns final report |

### Planned Routes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/next-question` | ✅ | FSM + Concept Selector → calls LLM → returns 1 question + must_have[] |
| POST | `/evaluate-answer` | ✅ | Transformers.js cosine similarity → returns mastery score |
| GET | `/competency-graph/:interviewId` | ✅ | Returns full competency node tree for visualization |

---

## 🧮 Algorithms Used

### 1. Concept Priority Selector
Sorts unexplored nodes by descending weight. Always picks the concept with the highest unexplored weight:
```javascript
const nextConcept = competencyNodes
  .filter(n => n.questionsAsked === 0)
  .sort((a, b) => b.weight - a.weight)[0];
```

### 2. FSM State Transition
```javascript
function nextFSMState(currentState, score) {
  if (currentState === 'EXPLORE')    return score > 0.8 ? 'VERIFY'    : 'CLARIFY';
  if (currentState === 'VERIFY')     return score > 0.8 ? 'DEEP_DIVE' : 'MOVE_ON';
  if (currentState === 'CLARIFY')    return 'MOVE_ON';
  if (currentState === 'DEEP_DIVE')  return 'MOVE_ON';
  return 'MOVE_ON';
}
```

### 3. Mastery — Weighted Moving Average
```javascript
// No magic constants. Simple average of all scores on this concept.
node.mastery = (node.mastery * node.questionsAsked + newScore) / (node.questionsAsked + 1);
```

### 4. Confidence — Ratio of Evidence to Budget
```javascript
const BUDGET = 3; // max questions per concept
node.confidence = Math.min(1.0, node.questionsAsked / BUDGET);
```

### 5. Assessment Completion Check
```javascript
function shouldStopInterview(totalQs, competencyNodes) {
  if (totalQs < 5) return false;
  if (totalQs >= 10) return true;
  const highPriorityNodes = competencyNodes.filter(n => n.weight >= 2);
  return highPriorityNodes.every(n => n.questionsAsked > 0);
}
```

---

## 📊 Data Graphs & Competency Structures

### Competency Tree (CSE Domain)

The following is the built-in concept tree used to initialize competency nodes for CSE/Software Engineering roles:

```
Software Engineering
│
├── DBMS (weight: 1 base, +2 if in skills, +3 if in project)
│   ├── ER Model & Relationships
│   ├── Normalization (1NF, 2NF, 3NF, BCNF)
│   ├── SQL Queries & Joins
│   ├── Transactions & ACID Properties
│   ├── Indexing & Query Optimization
│   └── NoSQL vs SQL
│
├── Operating Systems (weight: 1 base)
│   ├── Processes vs Threads
│   ├── CPU Scheduling Algorithms
│   ├── Memory Management & Paging
│   ├── Virtual Memory & Page Faults
│   ├── Deadlocks (Detection, Prevention, Avoidance)
│   └── Semaphores & Mutex
│
├── Computer Networks (weight: 1 base)
│   ├── OSI vs TCP/IP Model
│   ├── TCP vs UDP
│   ├── HTTP / HTTPS / WebSockets
│   ├── DNS Resolution
│   ├── Routing Algorithms
│   └── Load Balancing
│
├── Data Structures & Algorithms (weight: 1 base)
│   ├── Arrays, Linked Lists, Trees
│   ├── Sorting & Searching
│   ├── Graphs (BFS, DFS)
│   ├── Dynamic Programming
│   └── Time/Space Complexity
│
├── System Design (weight: 1 base)
│   ├── Scalability Patterns
│   ├── Caching (Redis, Memcached)
│   ├── Message Queues (Kafka, RabbitMQ)
│   ├── CAP Theorem
│   └── Microservices vs Monolith
│
└── Candidate Projects (weight: 3 — highest priority)
    └── [Dynamically extracted from resume]
        e.g. "JWT Authentication", "MongoDB Schema Design",
             "React State Management", "REST API Design"
```

### Competency Node State over Time

```
Concept: "ACID Transactions"

Initial State:
  mastery    = 0.0  (unknown)
  confidence = 0.0  (no evidence)
  evidence   = []

After Question 1 (EXPLORE, score = 0.65):
  mastery    = (0.0 * 0 + 0.65) / 1 = 0.65
  confidence = 1 / 3 = 0.33
  evidence   = ["Partial explanation of atomicity (65%)"]
  FSM        → CLARIFY (score <= 0.8)

After Question 2 (CLARIFY, score = 0.80):
  mastery    = (0.65 * 1 + 0.80) / 2 = 0.725
  confidence = 2 / 3 = 0.67
  evidence   = ["Partial explanation of atomicity (65%)",
                "Correctly explained consistency (80%)"]
  FSM        → MOVE_ON

Final Node:
  mastery    = 0.725  → 72.5%
  confidence = 67%
```

### Report Competency Bar Example

```
Candidate: "Pooja Sharma" | Role: Software Engineer | Mode: Technical

Competency Report
─────────────────────────────────────────────────────
DBMS (Transactions, Indexing, SQL)
  Mastery:     ████████░░  72%   [Evidence: 2 questions]
  Confidence:  ██████░░░░  67%

Operating Systems (Processes, Memory)
  Mastery:     █████████░  89%   [Evidence: 2 questions]
  Confidence:  ██████░░░░  67%

React (from Project Claim)
  Mastery:     ████████░░  78%   [Evidence: 3 questions]
  Confidence:  ██████████  100%

Node.js (from Skill Claim)
  Mastery:     ██████░░░░  60%   [Evidence: 1 question]
  Confidence:  ████░░░░░░  33%
─────────────────────────────────────────────────────
Final Score:    7.5 / 10
Total Questions Asked: 8
Interview Stopped:     All resume claims verified
```

---

## 🤖 ML Evaluation Engine

### Sentence Embedding (Transformers.js)

Model: `all-MiniLM-L6-v2` — 384-dimensional ONNX model, runs natively in Node.js.

**Cosine Similarity:**
```
Sim(M_i) = (v_cand · v_Mi) / (|v_cand| × |v_Mi|)
```

**Evaluation Score:**
```
S_eval = P_length × average(Sim(M_1), Sim(M_2), ... Sim(M_N))

where P_length = min(1.0, WordCount(answer) / 8)
```

### Example

Question: "What is the primary purpose of ACID properties?"

must_have = [
  "database reliability",
  "all-or-nothing execution",
  "isolation of concurrent transactions"
]

Candidate answer: "ACID ensures the database stays consistent and transactions either fully complete or don't happen at all."

Similarity scores:
- vs "database reliability"              → 0.78
- vs "all-or-nothing execution"          → 0.85
- vs "isolation of concurrent..."        → 0.52

Average similarity = (0.78 + 0.85 + 0.52) / 3 = 0.717
Word count = 22 → P_length = min(1.0, 22/8) = 1.0
S_eval = 1.0 × 0.717 = **0.717 → 71.7%**

---

## 📂 Detailed Documentation

- **[COMPETENCY_EVALUATION_ML.md](./COMPETENCY_EVALUATION_ML.md)** — Full detail on FSM states, scoring formulas, graph update math, and stopping rules.
