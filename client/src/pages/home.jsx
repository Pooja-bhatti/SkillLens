import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from "motion/react"
import { 
  BsSliders, BsMic, BsClock, BsBarChart, BsFileEarmark, 
  BsPlusCircle, BsArrowRight, BsChevronRight, BsActivity,
  BsAward, BsCheckCircleFill, BsExclamationTriangleFill
} from "react-icons/bs"
import { LiaCoinsSolid } from "react-icons/lia"
import axios from 'axios'
import { ServerUrl } from '../App'
import AuthModel from '../components/AuthModel'

// Asset imports
import evalImg from "../assets/ai-ans.png"
import resumeImg from "../assets/resume.png"
import pdfImg from "../assets/pdf.png"
import analyticsImg from "../assets/history.png"
import hrImg from "../assets/HR.png"
import techImg from "../assets/tech.png"
import confidenceImg from "../assets/confi.png"
import creditImg from "../assets/credit.png"

function Home() {
  const { userData } = useSelector((state) => state.user)
  const [showAuth, setAuth] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyData, setHistoryData] = useState({ interviews: [], stats: {}, recommendations: [], competencyScores: [] })
  const navigate = useNavigate()

  useEffect(() => {
    if (userData) {
      setLoadingHistory(true)
      axios.get(`${ServerUrl}/api/interview/history`, { withCredentials: true })
        .then((res) => {
          setHistoryData(res.data || { interviews: [], stats: {}, recommendations: [], competencyScores: [] })
        })
        .catch((err) => console.error("Error loading dashboard data:", err))
        .finally(() => setLoadingHistory(false))
    }
  }, [userData])

  // Helper to format date
  const formatDateSimple = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }

  // ── RENDER AUTHENTICATED WORKSPACE ──────────────────────────────────────────
  if (userData) {
    const { interviews = [], stats = {}, recommendations = [], competencyScores = [] } = historyData
    const recentInterviews = interviews.slice(0, 4)

    return (
      <div className="min-h-screen bg-bg-main text-text-primary">
        {/* Sidebar Nav Component */}
        <Navbar />

        {/* Workspace Canvas (Shifted left for Sidebar) */}
        <div className="pl-64 min-h-screen flex flex-col">
          <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
            
            {/* Dashboard Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-main/50 pb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-text-primary">
                  Recruiter Workspace
                </h1>
                <p className="text-xs text-text-secondary mt-1 font-medium">
                  Welcome back, {userData.name} · Managing active mock grading engines
                </p>
              </div>
              <button
                onClick={() => navigate("/interview")}
                className="flex items-center gap-2 bg-primary-accent hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <BsPlusCircle /> Initiate Assessment
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card-main p-6 rounded-2xl border border-border-main shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Assessments</p>
                  <p className="text-2xl font-black text-text-primary mt-2">{stats.totalInterviews || 0}</p>
                </div>
                <div className="bg-secondary-accent/10 text-secondary-accent p-3 rounded-xl">
                  <BsSliders size={20} />
                </div>
              </div>
              <div className="bg-card-main p-6 rounded-2xl border border-border-main shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Completed Sessions</p>
                  <p className="text-2xl font-black text-text-primary mt-2">{stats.completed || 0}</p>
                </div>
                <div className="bg-brand-success/10 text-brand-success p-3 rounded-xl">
                  <BsCheckCircleFill size={20} />
                </div>
              </div>
              <div className="bg-card-main p-6 rounded-2xl border border-border-main shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Average Candidate Score</p>
                  <p className="text-2xl font-black text-text-primary mt-2">
                    {stats.overallAvgScore ? `${stats.overallAvgScore}/10` : 'N/A'}
                  </p>
                </div>
                <div className="bg-primary-accent/10 text-primary-accent p-3 rounded-xl">
                  <BsAward size={20} />
                </div>
              </div>
            </div>

            {/* Main Dashboard Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column (Assessments & Activity) */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Recent Assessments Card */}
                <div className="bg-card-main rounded-2xl border border-border-main shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border-main/40 pb-3">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Recent Assessments</h2>
                    <button onClick={() => navigate("/history")} className="text-xs font-bold text-primary-accent hover:underline flex items-center gap-1 cursor-pointer">
                      View all <BsChevronRight size={10} />
                    </button>
                  </div>

                  {loadingHistory ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-8 h-8 border-4 border-border-main border-t-primary-accent rounded-full animate-spin" />
                    </div>
                  ) : recentInterviews.length === 0 ? (
                    <div className="py-12 text-center text-text-secondary text-sm">
                      No candidate assessments conducted yet. Click "Initiate Assessment" to start.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-main/50 text-[10px] uppercase font-bold text-text-secondary">
                            <th className="pb-3">Candidate Role</th>
                            <th className="pb-3">Track</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3 text-right">Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-main/30 text-xs">
                          {recentInterviews.map((iv) => (
                            <tr key={iv._id} className="hover:bg-bg-secondary/40 transition">
                              <td className="py-3 font-bold text-text-primary">
                                {iv.role} <span className="font-normal text-text-secondary text-[10px]">({iv.experience})</span>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                  iv.mode === 'Coding' 
                                    ? 'bg-brand-success/15 border-brand-success/25 text-brand-success' 
                                    : iv.mode === 'HR' 
                                      ? 'bg-primary-accent/15 border-primary-accent/25 text-primary-accent' 
                                      : 'bg-secondary-accent/15 border-secondary-accent/25 text-secondary-accent'
                                }`}>
                                  {iv.mode}
                                </span>
                              </td>
                              <td className="py-3 text-text-secondary">
                                {formatDateSimple(iv.createdAt)}
                              </td>
                              <td className="py-3 text-right font-black text-text-primary">
                                {iv.finalScore ? `${iv.finalScore.toFixed(1)}/10` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Performance Overview (Custom SVG Line/Bar Chart Representation) */}
                <div className="bg-card-main rounded-2xl border border-border-main shadow-sm p-6 space-y-4">
                  <div className="border-b border-border-main/40 pb-3">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Performance Trends</h2>
                  </div>
                  
                  {interviews.filter(iv => iv.finalScore > 0).length < 1 ? (
                    <div className="py-12 text-center text-text-secondary text-sm">
                      Complete at least 1 assessment to generate performance trends.
                    </div>
                  ) : (
                    <div className="h-56 w-full flex flex-col justify-between pt-4">
                      {/* Grid representation */}
                      <div className="relative flex-1 flex items-end justify-between border-b border-border-main/50 px-4">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                          <div className="border-b border-border-main/20 w-full" />
                          <div className="border-b border-border-main/20 w-full" />
                          <div className="border-b border-border-main/20 w-full" />
                        </div>
                        {/* Custom CSS Bar charts displaying score profiles */}
                        {interviews.filter(iv => iv.finalScore > 0).slice(0, 8).reverse().map((iv, idx) => {
                          const heightPct = Math.max(10, (iv.finalScore || 0) * 10)
                          return (
                            <div key={iv._id} className="h-full flex flex-col justify-end items-center gap-2 group cursor-pointer relative">
                              <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-text-primary text-bg-main text-[9px] px-2 py-0.5 rounded font-bold transition">
                                {iv.finalScore?.toFixed(1)}
                              </span>
                              <div 
                                className="w-8 bg-primary-accent/80 hover:bg-primary-accent rounded-t-md transition-all duration-300"
                                style={{ height: `${heightPct}%` }}
                              />
                              <span className="text-[10px] text-text-secondary font-bold">
                                #{idx + 1}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-[10px] text-text-secondary font-bold px-2 pt-2">
                        <span>Older Sessions ➔</span>
                        <span>Latest Assessments</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (Activity & Insights) */}
              <div className="lg:col-span-4 space-y-8">
                
                {/* Competency Scorecard — all tested subjects */}
                <div className="bg-card-main rounded-2xl border border-border-main shadow-sm p-6 space-y-4">
                  <div className="border-b border-border-main/40 pb-3">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Subject-Wise Scores</h2>
                  </div>
                  
                  {competencyScores.length === 0 ? (
                    <div className="py-6 text-center text-text-secondary text-sm">
                      No subjects evaluated yet. Complete an assessment to see scores.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                      {competencyScores.map((cs) => {
                        const notAttempted = cs.answered === 0;
                        const scoreColor = notAttempted
                          ? { bar: 'bg-border-main', badge: 'text-text-secondary bg-bg-secondary/50 border-border-main' }
                          : cs.mastery >= 70
                            ? { bar: 'bg-brand-success', badge: 'text-brand-success bg-brand-success/10 border-brand-success/20' }
                            : cs.mastery >= 40
                              ? { bar: 'bg-brand-warning', badge: 'text-brand-warning bg-brand-warning/10 border-brand-warning/20' }
                              : { bar: 'bg-brand-error', badge: 'text-brand-error bg-brand-error/10 border-brand-error/20' }
                        return (
                          <div key={cs.concept} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className={`font-bold truncate max-w-[130px] ${notAttempted ? 'text-text-secondary' : 'text-text-primary'}`} title={cs.concept}>{cs.concept}</span>
                              <span className={`text-[10px] font-semibold uppercase border px-2 py-0.5 rounded-full ${scoreColor.badge}`}>
                                {notAttempted ? 'Pending' : `${cs.mastery}%`}
                              </span>
                            </div>
                            <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                              <div className={`h-full rounded-full transition-all duration-500 ${scoreColor.bar}`} style={{ width: `${notAttempted ? 5 : Math.max(5, cs.mastery)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Recruiter Activity timeline */}
                <div className="bg-card-main rounded-2xl border border-border-main shadow-sm p-6 space-y-4">
                  <div className="border-b border-border-main/40 pb-3 flex items-center gap-2">
                    <BsActivity className="text-primary-accent" />
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Session Logs</h2>
                  </div>
                  
                  {interviews.length === 0 ? (
                    <div className="py-6 text-center text-text-secondary text-sm">
                      No activity recorded.
                    </div>
                  ) : (
                    <div className="relative pl-4 border-l border-border-main/60 space-y-5">
                      {interviews.slice(0, 3).map((iv) => (
                        <div key={iv._id} className="text-xs relative">
                          {/* Indicator Dot */}
                          <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-border-main border-2 border-card-main" />
                          <p className="text-text-primary font-bold">{iv.role || 'Assessment'}</p>
                          <p className="text-text-secondary text-[10px] mt-0.5">
                            Status: <span className="font-semibold text-text-primary">{iv.status}</span> · Score: {iv.finalScore ? `${iv.finalScore.toFixed(1)}/10` : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // ── RENDER PUBLIC LANDING PAGE (IF LOGGED OUT) ──────────────────────────────
  return (
    <div className="min-h-screen bg-bg-main flex flex-col text-text-primary">
      <Navbar />
      
      <div className="flex-1 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Tag */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 bg-bg-secondary text-text-secondary border border-border-main text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">
              <span>Enterprise AI Interview Platform</span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center mb-28">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-text-primary leading-tight max-w-4xl mx-auto"
            >
              Evaluate candidate skills with
              <span className="block mt-2 text-primary-accent">Adaptive AI Assessments</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-text-secondary mt-6 max-w-2xl mx-auto text-base leading-relaxed"
            >
              Verify resumes, test coding execution under live pressure, analyze behavior, and review structured reasoning transcripts directly from an adaptive assessment engine.
            </motion.p>

            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <motion.button
                onClick={() => setAuth(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-primary-accent text-white px-8 py-3.5 rounded-xl hover:bg-opacity-95 transition shadow-sm cursor-pointer font-bold flex items-center gap-2 text-sm"
              >
                Get Started Now <BsArrowRight />
              </motion.button>
            </div>
          </div>

          {/* Setup Stages Cards */}
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 mb-28">
            {[
              {
                icon: <BsSliders size={20} />,
                step: "STAGE 1",
                title: "Resume Claim Validation",
                desc: "Parses PDF credentials, matches projects, and constructs an evaluation graph."
              },
              {
                icon: <BsMic size={20} />,
                step: "STAGE 2",
                title: "Adaptive FSM Interrogation",
                desc: "LLM adapts questions in real-time, testing bounds with verified transitions."
              },
              {
                icon: <BsClock size={20} />,
                step: "STAGE 3",
                title: "Semantic Evidence Logging",
                desc: "Compiles scores based on response overlap, formatting detailed report logs."
              }
            ].map((item, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 + index * 0.1 }}
                whileHover={{ y: -4 }}
                key={index} 
                className="relative bg-card-main rounded-2xl border border-border-main hover:border-primary-accent p-8 w-80 max-w-[90%] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
              >
                <div className="bg-bg-secondary text-primary-accent w-12 h-12 rounded-xl flex items-center justify-center border border-border-main mb-6">
                  {item.icon}
                </div>
                <div>
                  <div className="text-[10px] text-primary-accent font-bold tracking-wider mb-1">{item.step}</div>
                  <h3 className="font-bold mb-3 text-base text-text-primary">{item.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Capabilities Grid */}
          <div className="mb-32">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-2xl font-bold text-center text-text-primary mb-16 uppercase tracking-wider"
            >
              Platform Capabilities
            </motion.h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  image: evalImg,
                  icon: <BsBarChart size={20} />,
                  title: "AI Response Auditing",
                  desc: "Scores semantic accuracy, communication structure, and response timelines."
                },
                {
                  image: resumeImg,
                  icon: <BsFileEarmark size={20} />,
                  title: "Interactive Resume Mapping",
                  desc: "Matches real-time questions directly against claimed skills and project credentials."
                },
                {
                  image: pdfImg,
                  icon: <BsFileEarmark size={20} />,
                  title: "Audit Scorecards & Reports",
                  desc: "Generates download-ready PDF transcripts outlining candidate strengths, weaknesses, and evidence logs."
                },
                {
                  image: analyticsImg,
                  icon: <BsBarChart size={20} />,
                  title: "Recruiter Analytics Center",
                  desc: "Aggregates overall performance ratios, competency gap trends, and candidate analytics."
                }
              ].map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -2 }}
                  key={index} 
                  className="bg-card-main border border-border-main rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full md:w-1/2 flex justify-center">
                      <img src={item.image} alt={item.title} className="w-full h-auto object-contain max-h-48" />
                    </div>
                    <div className="w-full md:w-1/2">
                      <div className="bg-bg-secondary text-primary-accent w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-border-main">
                        {item.icon}
                      </div>
                      <h3 className="font-bold mb-3 text-lg text-text-primary">
                        {item.title}
                      </h3>
                      <p className="text-text-secondary text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Interview Tracks Section */}
          <div className="mb-32">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-2xl font-bold text-center text-text-primary mb-16 uppercase tracking-wider"
            >
              Structured Interview Modes
            </motion.h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  image: hrImg,
                  title: "HR & STAR Methodology",
                  desc: "Behavioral testing designed to analyze response structure, leadership traits, and situation resolutions."
                },
                {
                  image: techImg,
                  title: "Technical & System Architecture",
                  desc: "Core question algorithms focused on backend logic, database, operating systems, and core architecture skills."
                },
                {
                  image: confidenceImg,
                  title: "Algorithmic Code Engine",
                  desc: "Interactive coding tracks challenging candidate algorithm planning, complexity analysis, and edge case testing."
                },
                {
                  image: creditImg,
                  title: "Credit Scale Licensing",
                  desc: "Flexible, usage-based enterprise credit packages scaling to fit any organization's assessment volume."
                }
              ].map((mode, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -4 }}
                  key={index}
                  className="bg-card-main border border-border-main rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="w-1/2">
                      <h3 className="font-bold text-lg text-text-primary mb-3">
                        {mode.title}
                      </h3>
                      <p className="text-text-secondary text-xs leading-relaxed">{mode.desc}</p>
                    </div>
                    <div className="w-1/2 flex justify-end">
                      <img src={mode.image} alt={mode.title} className="w-24 h-24 object-contain" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {showAuth && <AuthModel onClose={() => setAuth(false)} />}
      <Footer />
    </div>
  )
}

export default Home