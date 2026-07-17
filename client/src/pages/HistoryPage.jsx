import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Step3Report from '../components/Step3Report';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FaArrowLeft, FaHistory, FaCheckCircle, FaTrophy, FaBookOpen, 
  FaChartLine, FaChevronUp, FaChevronDown, FaCogs, FaHandshake, 
  FaCode, FaExclamationTriangle, FaFileAlt
} from 'react-icons/fa';
import { BsAward, BsBarChart, BsActivity } from 'react-icons/bs';
import axios from 'axios';
import { ServerUrl } from '../App';

// Redefining warm-neutral color states
const MODE_COLORS = {
  Technical: 'bg-secondary-accent/15 text-secondary-accent border border-secondary-accent/20',
  HR: 'bg-primary-accent/15 text-primary-accent border border-primary-accent/20',
  Coding: 'bg-brand-success/15 text-brand-success border border-brand-success/20',
};

const STATUS_STYLE = {
  completed: 'bg-brand-success/15 text-brand-success border border-brand-success/20',
  Incompleted: 'bg-brand-warning/15 text-brand-warning border border-brand-warning/20',
};

function getScoreColor(score) {
  if (score >= 7) return 'text-brand-success';
  if (score >= 4) return 'text-brand-warning';
  return 'text-brand-error';
}

function getScoreRingColor(score) {
  if (score >= 7) return '#7A8B5A';
  if (score >= 4) return '#C7793B';
  return '#B95A4A';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

function MiniScoreRing({ score, size = 48 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const offset = circumference * (1 - pct);
  const color = getScoreRingColor(score);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius}
        stroke="#F3F0EB" strokeWidth="4" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth="4" fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-700" />
      <text x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="central"
        className="fill-text-primary font-bold text-xs"
        transform={`rotate(90 ${size / 2} ${size / 2})`}>
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');
  const [activeReport, setActiveReport] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${ServerUrl}/api/interview/history`, { withCredentials: true });
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main text-text-primary">
        <Navbar />
        <div className="pl-64 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-border-main border-t-primary-accent rounded-full animate-spin" />
            <p className="text-text-secondary text-sm font-medium">Loading history logs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-main text-text-primary">
        <Navbar />
        <div className="pl-64 min-h-screen flex items-center justify-center">
          <div className="bg-card-main rounded-xl border border-border-main shadow-sm p-8 text-center max-w-md">
            <FaExclamationTriangle className="text-brand-warning mx-auto mb-4" size={36} />
            <p className="text-text-primary font-bold mb-2">Something went wrong</p>
            <p className="text-text-secondary text-xs">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { interviews = [], recommendations = [], stats = {} } = data || {};

  // ── RENDER PAST SCORECARD POPUP OVERLAY ──────────────────────────────────────
  if (activeReport) {
    return (
      <div className="min-h-screen bg-bg-main text-text-primary">
        <Navbar />
        <div className="pl-64 min-h-screen p-8">
          <div className="max-w-5xl mx-auto bg-card-main border border-border-main rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-border-main/50 pb-4">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Candidate Scorecard Report</span>
              <button 
                onClick={() => setActiveReport(null)}
                className="px-4 py-1.5 bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-main rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ← Back to Analytics
              </button>
            </div>
            
            <Step3Report report={activeReport} />
          </div>
        </div>
      </div>
    );
  }

  // Calculate competency averages for heatmap
  const getCompetencyAverages = () => {
    const conceptMap = {};
    interviews.forEach(iv => {
      if (iv.competencyNodes) {
        iv.competencyNodes.forEach(node => {
          if (node.questionsAsked > 0) {
            if (!conceptMap[node.concept]) {
              conceptMap[node.concept] = { concept: node.concept, totalMastery: 0, totalConfidence: 0, count: 0 };
            }
            conceptMap[node.concept].totalMastery += node.mastery;
            conceptMap[node.concept].totalConfidence += node.confidence;
            conceptMap[node.concept].count += 1;
          }
        });
      }
    });

    return Object.values(conceptMap).map(c => ({
      concept: c.concept,
      avgMastery: Math.round((c.totalMastery / c.count) * 100),
      avgConfidence: Math.round((c.totalConfidence / c.count) * 100),
      sessionsTested: c.count
    })).sort((a, b) => b.sessionsTested - a.sessionsTested);
  };

  const competencyAverages = getCompetencyAverages();

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <Navbar />

      {/* Main Canvas shifting for Left Sidebar */}
      <div className="pl-64 min-h-screen p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header block */}
        <div className="border-b border-border-main/50 pb-6">
          <h1 className="text-2xl font-black tracking-tight text-text-primary">Performance Analytics</h1>
          <p className="text-xs text-text-secondary mt-1">
            Browse overall candidate performance ratios, competency scores, and scorecard archives.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card-main p-6 rounded-2xl border border-border-main shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-secondary-accent/15 flex items-center justify-center">
              <FaHistory className="text-secondary-accent" size={18} />
            </div>
            <div>
              <p className="text-2xl font-black text-text-primary">{stats.totalInterviews || 0}</p>
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Total Assessments</p>
            </div>
          </div>

          <div className="bg-card-main p-6 rounded-2xl border border-border-main shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-brand-success/15 flex items-center justify-center">
              <FaCheckCircle className="text-brand-success" size={18} />
            </div>
            <div>
              <p className="text-2xl font-black text-text-primary">{stats.completed || 0}</p>
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Completed Tracks</p>
            </div>
          </div>

          <div className="bg-card-main p-6 rounded-2xl border border-border-main shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary-accent/15 flex items-center justify-center">
              <FaTrophy className="text-primary-accent" size={18} />
            </div>
            <div>
              <p className={`text-2xl font-black ${getScoreColor(stats.overallAvgScore || 0)}`}>
                {stats.overallAvgScore || 0}<span className="text-sm text-text-secondary font-medium">/10</span>
              </p>
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Average Grade</p>
            </div>
          </div>
        </div>

        {/* ── PERFORMANCE HEATMAP GRID ────────────────────────────────────────── */}
        {competencyAverages.length > 0 && (
          <div className="bg-card-main rounded-2xl border border-border-main shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border-main/40 pb-3">
              <BsBarChart className="text-primary-accent" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Competency Performance Heatmap</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {competencyAverages.map((comp) => {
                const mastery = comp.avgMastery;
                // Heatmap logic coloring: Green = High, Gold = Mod, Red = Weak
                const cardColorStyle = mastery >= 80 
                  ? 'bg-brand-success/10 border-brand-success/20 text-brand-success' 
                  : mastery >= 50 
                    ? 'bg-secondary-accent/10 border-secondary-accent/20 text-secondary-accent' 
                    : 'bg-brand-error/10 border-brand-error/20 text-brand-error'

                return (
                  <div key={comp.concept} className={`border rounded-xl p-4 flex flex-col justify-between h-28 shadow-sm ${cardColorStyle}`}>
                    <div>
                      <p className="font-bold text-xs text-text-primary truncate">{comp.concept}</p>
                      <p className="text-[9px] opacity-75 mt-0.5 font-medium">{comp.sessionsTested} sessions tested</p>
                    </div>
                    <div className="flex items-baseline justify-between pt-2">
                      <span className="text-[9px] uppercase font-bold tracking-wider opacity-85">Average Mastery</span>
                      <span className="text-lg font-black">{mastery}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Session Scorecard list */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <BsActivity className="text-primary-accent" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Historical Assessment Archives</h2>
          </div>

          {interviews.length === 0 ? (
            <div className="bg-card-main border border-border-main rounded-2xl p-12 text-center shadow-sm">
              <FaHistory className="text-text-secondary/30 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-black text-text-primary mb-2">No scorecards found</h3>
              <p className="text-text-secondary text-xs">Run a candidate interview setup to generate reports.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((iv, idx) => {
                const isExpanded = expandedId === iv._id;
                return (
                  <motion.div key={iv._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="bg-card-main rounded-2xl border border-border-main shadow-sm overflow-hidden hover:border-primary-accent/40 transition duration-200"
                  >
                    <button onClick={() => setExpandedId(isExpanded ? null : iv._id)}
                      className="w-full flex items-center gap-5 p-6 text-left hover:bg-bg-secondary/40 transition cursor-pointer">
                      
                      <MiniScoreRing score={iv.finalScore || 0} />
                      
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${MODE_COLORS[iv.mode] || ''}`}>
                            {iv.mode}
                          </span>
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${STATUS_STYLE[iv.status] || ''}`}>
                            {iv.status === 'completed' ? '✓ Completed' : '⏸ Incomplete'}
                          </span>
                        </div>
                        <p className="font-bold text-text-primary text-sm truncate">
                          {iv.role || 'Assessment'}{iv.experience ? ` · ${iv.experience}` : ''}
                        </p>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          {formatDate(iv.createdAt)} · {iv.totalQuestions} questions asked
                        </p>
                      </div>

                      <div className="text-text-secondary flex-shrink-0">
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-2 border-t border-border-main text-xs space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-bg-secondary rounded-xl p-3 text-center border border-border-main/50">
                                <p className="text-lg font-black text-text-primary">{iv.totalQuestions}</p>
                                <p className="text-[9px] text-text-secondary uppercase font-bold">Total Prompts</p>
                              </div>
                              <div className="bg-bg-secondary rounded-xl p-3 text-center border border-border-main/50">
                                <p className="text-lg font-black text-text-primary">{iv.answered || 0}</p>
                                <p className="text-[9px] text-text-secondary uppercase font-bold">Answers Logged</p>
                              </div>
                              <div className="bg-bg-secondary rounded-xl p-3 text-center border border-border-main/50">
                                <p className="text-lg font-black text-brand-success">{iv.strongAreas?.length || 0}</p>
                                <p className="text-[9px] text-text-secondary uppercase font-bold">Strong Skills</p>
                              </div>
                              <div className="bg-bg-secondary rounded-xl p-3 text-center border border-border-main/50">
                                <p className="text-lg font-black text-brand-error">{iv.weakAreas?.length || 0}</p>
                                <p className="text-[9px] text-text-secondary uppercase font-bold">Gaps Identified</p>
                              </div>
                            </div>

                            {/* Verification Summary */}
                            <div className="flex flex-wrap gap-4 pt-2">
                              {iv.strongAreas?.length > 0 && (
                                <div className="flex-1 min-w-[200px] space-y-1.5">
                                  <p className="text-[9px] font-bold text-brand-success uppercase tracking-wider">Proven Competencies</p>
                                  <div className="flex flex-wrap gap-1">
                                    {iv.strongAreas.map(s => (
                                      <span key={s.concept} className="bg-bg-secondary text-brand-success border border-border-main px-2 py-0.5 rounded text-[10px] font-semibold">
                                        {s.concept} ({s.mastery}%)
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {iv.weakAreas?.length > 0 && (
                                <div className="flex-1 min-w-[200px] space-y-1.5">
                                  <p className="text-[9px] font-bold text-brand-error uppercase tracking-wider">Opportunities Detected</p>
                                  <div className="flex flex-wrap gap-1">
                                    {iv.weakAreas.map(w => (
                                      <span key={w.concept} className="bg-bg-secondary text-brand-error border border-border-main px-2 py-0.5 rounded text-[10px] font-semibold">
                                        {w.concept} ({w.mastery}%)
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Scorecard review trigger button */}
                            {iv.status === 'completed' && (
                              <div className="pt-2 flex justify-end">
                                <button
                                  onClick={() => setActiveReport(iv)}
                                  className="flex items-center gap-1.5 bg-primary-accent text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition cursor-pointer"
                                >
                                  <FaFileAlt /> View Full Report Scorecard
                                </button>
                              </div>
                            )}

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default HistoryPage;
