import React, { useState } from 'react';
import { 
  FaCheckCircle, FaChevronDown, FaChevronUp, FaPrint, FaChartBar, 
  FaBrain, FaArrowRight, FaUserCheck, FaFileAlt, FaCheck, FaTimes,
  FaLightbulb, FaShieldAlt
} from 'react-icons/fa';
import { BsAward, BsSliders, BsFileEarmarkCheck } from 'react-icons/bs';

const FSM_COLORS = {
  EXPLORE:   'bg-bg-secondary text-text-secondary border border-border-main',
  VERIFY:    'bg-secondary-accent/15 text-secondary-accent border border-secondary-accent/25',
  DEEP_DIVE: 'bg-primary-accent/15 text-primary-accent border border-primary-accent/25',
  CLARIFY:   'bg-brand-warning/15 text-brand-warning border border-brand-warning/25',
  MOVE_ON:   'bg-bg-secondary text-text-secondary border border-border-main',
};

function Step3Report({ report }) {
  const {
    role = 'Candidate',
    experience = 'Not specified',
    mode = 'Technical',
    finalScore = 0,
    correctness = 0,
    communication = 0,
    confidence = 0,
  } = report || {};

  const competencyNodes = report?.competencyNodes || [];
  const questionWiseScore = report?.questionWiseScore || [];

  // Accordion expands
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [recruiterNotes, setRecruiterNotes] = useState("");

  const handlePrint = () => {
    window.print();
  };

  // Determine hiring recommendation
  const getRecommendation = (score) => {
    if (score >= 8) return {
      status: 'Strong Hire',
      desc: 'The candidate demonstrated excellent mastery, consistent semantic accuracy, and solid structural confidence across core competencies.',
      style: 'border-brand-success bg-brand-success/5 text-brand-success'
    };
    if (score >= 5) return {
      status: 'Review / Further Loop',
      desc: 'The candidate showed solid baseline alignment but exhibited minor accuracy or structural gaps in key concepts.',
      style: 'border-brand-warning bg-brand-warning/5 text-brand-warning'
    };
    return {
      status: 'No Hire',
      desc: 'Significant competency and conceptual alignment gaps were verified during FSM interrogation sessions.',
      style: 'border-brand-error bg-brand-error/5 text-brand-error'
    };
  };

  const recommendation = getRecommendation(finalScore);

  // Group competencies (Resume Project vs Resume Skill vs Core CS)
  const resumeClaims = competencyNodes.filter(
    node => node.parent === 'Resume Project' || node.parent === 'Resume Skill'
  );
  
  const coreCompetencies = competencyNodes.filter(
    node => node.parent !== 'Resume Project' && node.parent !== 'Resume Skill'
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10 print:py-0 print:px-0">
      
      {/* ── SECTION 1: HEADER & PRINT TRIGGER ────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border-main/50 pb-6 no-print">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">Evaluation Scorecard</h1>
          <p className="text-xs text-text-secondary mt-1">
            AI-generated audit scorecard mapping FSM boundaries and candidate evidence metrics.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-primary-accent hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <FaPrint /> Print / Export PDF
        </button>
      </div>

      {/* ── SECTION 2: CANDIDATE OVERVIEW & GRADES ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Profile Card (Left 7 cols) */}
        <div className="lg:col-span-8 bg-card-main border border-border-main rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Candidate overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-bg-secondary/40 p-4 rounded-xl text-xs">
              <div>
                <p className="text-[10px] text-text-secondary uppercase">Applied Role</p>
                <p className="font-bold text-text-primary mt-0.5 truncate">{role}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase">Experience</p>
                <p className="font-bold text-text-primary mt-0.5">{experience}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase">Interview Mode</p>
                <p className="font-bold text-text-primary mt-0.5">{mode}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase">Questions Asked</p>
                <p className="font-bold text-text-primary mt-0.5">{questionWiseScore.length} questions</p>
              </div>
            </div>

            {/* Recruiter Custom Notes */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Recruiter Evaluation Notes</label>
              <textarea 
                rows={3}
                placeholder="Enter candidate interview feedback notes here..."
                value={recruiterNotes}
                onChange={(e) => setRecruiterNotes(e.target.value)}
                className="w-full p-3.5 border border-border-main rounded-xl focus:ring-1 focus:ring-primary-accent focus:border-primary-accent outline-none bg-bg-main text-text-primary text-xs placeholder-text-secondary/50 transition resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Grade rings summary list (Right 4 cols) */}
        <div className="lg:col-span-4 bg-card-main border border-border-main rounded-2xl p-6 flex flex-col justify-between shadow-sm space-y-4">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Grading metrics</h3>
          
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-text-primary">Overall Rating</span>
                <span className="text-primary-accent">{finalScore}/10</span>
              </div>
              <div className="h-2 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                <div className="h-full bg-primary-accent rounded-full" style={{ width: `${finalScore * 10}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-text-primary">Semantic Correctness</span>
                <span className="text-secondary-accent">{correctness}/10</span>
              </div>
              <div className="h-2 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                <div className="h-full bg-secondary-accent rounded-full" style={{ width: `${correctness * 10}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-text-primary">STAR Communication</span>
                <span className="text-brand-success">{communication}/10</span>
              </div>
              <div className="h-2 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                <div className="h-full bg-brand-success rounded-full" style={{ width: `${communication * 10}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-text-primary">Response Confidence</span>
                <span className="text-brand-warning">{confidence}/10</span>
              </div>
              <div className="h-2 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                <div className="h-full bg-brand-warning rounded-full" style={{ width: `${confidence * 10}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── SECTION 3: DECISION BANNERS ────────────────────────────────────── */}
      <div className={`border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4 ${recommendation.style}`}>
        <div className="bg-card-main p-3 rounded-xl border border-inherit">
          <FaShieldAlt size={22} />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Hiring Decision Recommendation</span>
          <h2 className="text-lg font-black mt-0.5">{recommendation.status}</h2>
          <p className="text-xs opacity-80 mt-1 leading-relaxed">{recommendation.desc}</p>
        </div>
      </div>

      {/* ── SECTION 4: RESUME CLAIMS VERIFICATION ─────────────────────────── */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border-main/50 pb-3">
          <BsFileEarmarkCheck className="text-primary-accent" size={18} />
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Resume Claim Verification</h3>
        </div>

        {resumeClaims.length === 0 ? (
          <p className="text-xs text-text-secondary italic py-2">
            No resume skills or project nodes were registered for direct verification.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-main/40 text-[9px] uppercase font-bold text-text-secondary">
                  <th className="pb-3">Extracted Claim (Project / Skill)</th>
                  <th className="pb-3">Verification Track</th>
                  <th className="pb-3">Session Status</th>
                  <th className="pb-3 text-right">Proven Mastery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/30">
                {resumeClaims.map((claim, idx) => (
                  <tr key={idx} className="hover:bg-bg-secondary/20 transition">
                    <td className="py-3 font-bold text-text-primary">{claim.concept}</td>
                    <td className="py-3 text-text-secondary text-[10px] uppercase font-semibold">
                      {claim.parent === 'Resume Project' ? '💼 Project Scope' : '⚙️ Skill Target'}
                    </td>
                    <td className="py-3">
                      {claim.questionsAsked > 0 ? (
                        <span className="text-[10px] text-brand-success font-semibold flex items-center gap-1.5">
                          <FaCheck size={10} /> Active Audited
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-secondary/70 italic flex items-center gap-1.5">
                          <FaTimes size={10} /> Not Interrogated
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right font-black text-text-primary">
                      {claim.questionsAsked > 0 ? `${Math.round(claim.mastery * 100)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 5: COMPETENCY PROFILE GRID ────────────────────────────── */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border-main/50 pb-3">
          <FaChartBar className="text-primary-accent" size={16} />
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Competency Map Profile</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coreCompetencies.map((node, idx) => (
            <div key={idx} className="bg-bg-secondary/40 border border-border-main rounded-xl p-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">{node.concept}</span>
                <span className="text-[9px] font-bold text-text-secondary uppercase bg-bg-secondary border border-border-main px-2 py-0.5 rounded-full">
                  Topic weight: {node.weight}
                </span>
              </div>

              {node.questionsAsked > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                      <span>Mastery</span>
                      <span className="font-bold text-text-primary">{Math.round(node.mastery * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                      <div className="h-full bg-brand-success rounded-full" style={{ width: `${node.mastery * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                      <span>Confidence</span>
                      <span className="font-bold text-text-primary">{Math.round(node.confidence * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                      <div className="h-full bg-secondary-accent rounded-full" style={{ width: `${node.confidence * 100}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-text-secondary/70 italic">Not tested in this session.</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 6: EVIDENCE & DETAILED TRANSCRIPTS Accordions ────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <FaBrain className="text-primary-accent" />
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">AI Interrogation Journey</h3>
        </div>

        <div className="space-y-4">
          {questionWiseScore.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-card-main border border-border-main rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Header Toggle */}
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-6 hover:bg-bg-secondary/40 transition text-left cursor-pointer no-print"
                >
                  <div className="flex-1 pr-6">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Question {idx + 1}</span>
                      {item.concept && (
                        <span className="text-[9px] font-bold text-primary-accent bg-primary-accent/10 border border-primary-accent/25 px-2 py-0.5 rounded-full uppercase">
                          {item.concept}
                        </span>
                      )}
                      {item.fsmState && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${FSM_COLORS[item.fsmState] || 'bg-bg-secondary text-text-secondary border-border-main'}`}>
                          {item.fsmState}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-text-primary text-sm leading-relaxed truncate max-w-xl">
                      "{item.question}"
                    </h4>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="bg-bg-secondary text-brand-success font-bold border border-border-main py-1 px-3 rounded-xl text-xs">
                      {item.score || 0}/10
                    </span>
                    {isExpanded ? <FaChevronUp className="text-text-secondary" /> : <FaChevronDown className="text-text-secondary" />}
                  </div>
                </button>

                {/* Print Header */}
                <div className="hidden print:block p-6 border-b border-border-main bg-bg-secondary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Question {idx + 1} · {item.concept}</span>
                    <span className="font-bold text-text-primary text-xs">{item.score || 0}/10</span>
                  </div>
                  <h4 className="font-bold text-text-primary text-sm mt-1">"{item.question}"</h4>
                </div>

                {/* Body Content */}
                <AnimatePresence initial={false}>
                  {(isExpanded || window.matchMedia('print').matches) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-6 pt-0 border-t border-border-main/50 space-y-5 text-xs">
                        
                        {/* Candidate response prompt */}
                        <div className="pt-4 space-y-1">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Candidate Response Transcript</span>
                          <p className="bg-bg-secondary/40 border border-border-main p-4 rounded-xl text-text-primary italic font-medium leading-relaxed">
                            "{item.answer || 'Response timed out or empty.'}"
                          </p>
                        </div>

                        {/* Grading Subscales */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div>
                            <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                              <span>Correctness Scale</span>
                              <span className="font-bold text-text-primary">{item.correctness || 0}/10</span>
                            </div>
                            <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                              <div className="h-full bg-secondary-accent rounded-full" style={{ width: `${(item.correctness || 0) * 10}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                              <span>STAR Communication</span>
                              <span className="font-bold text-text-primary">{item.communication || 0}/10</span>
                            </div>
                            <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                              <div className="h-full bg-brand-success rounded-full" style={{ width: `${(item.communication || 0) * 10}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                              <span>Confidence Metric</span>
                              <span className="font-bold text-text-primary">{item.confidence || 0}/10</span>
                            </div>
                            <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                              <div className="h-full bg-brand-warning rounded-full" style={{ width: `${(item.confidence || 0) * 10}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* AI Grading Rationale details */}
                        <div className="bg-bg-secondary rounded-xl p-4 border border-border-main space-y-1.5">
                          <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                            <FaLightbulb className="text-primary-accent" /> Evaluation details
                          </span>
                          <p className="text-text-secondary italic leading-relaxed">
                            "{item.feedback || 'No comments compiled.'}"
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 7: FOOTER ACTION ──────────────────────────────────────── */}
      <div className="no-print flex justify-center py-6 border-t border-border-main/50">
        <a
          href="/"
          className="flex items-center gap-2 bg-primary-accent hover:opacity-95 text-white px-8 py-3 rounded-xl font-bold shadow-sm transition text-xs"
        >
          Return to Dashboard <FaArrowRight />
        </a>
      </div>

    </div>
  );
}

export default Step3Report;