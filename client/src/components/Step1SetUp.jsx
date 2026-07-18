import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from "motion/react"
import { 
  BsFileEarmarkArrowUp, BsCpu, BsSliders, BsCodeSlash, 
  BsCheckCircleFill, BsGearFill, BsX, BsArrowRight, BsArrowLeft, 
  BsBriefcase, BsPersonWorkspace, BsFillRocketTakeoffFill
} from "react-icons/bs"
import { LiaCoinsSolid } from "react-icons/lia"
import axios from 'axios'
import { ServerUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../redux/userSlice'

function Step1SetUp({ onStart }) {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()

  // Setup form states
  const [workflowStep, setWorkflowStep] = useState(1)
  const [role, setrole] = useState("")
  const [experience, setexperience] = useState("")
  const [mode, setmode] = useState("Technical")
  const [resumefile, setresumefile] = useState(null)
  const [loading, setloading] = useState(false)
  const [projects, setprojects] = useState([])
  const [skills, setskills] = useState([])
  const [resumetext, setresumetext] = useState("")

  // Skill management helper states
  const [newSkill, setNewSkill] = useState("")
  const [newProject, setNewProject] = useState("")

  // Resume parsing progress helper states
  const [analyzing, setanalyzing] = useState(false)
  const [parseStep, setParseStep] = useState(0)

  // Step 2 effect: Auto-trigger resume analysis
  useEffect(() => {
    if (workflowStep === 2 && resumefile) {
      triggerAnalysis()
    }
  }, [workflowStep])

  const triggerAnalysis = async () => {
    setanalyzing(true)
    setParseStep(1) // reading pdf...
    
    const timer1 = setTimeout(() => setParseStep(2), 1200) // parsing credentials...
    const timer2 = setTimeout(() => setParseStep(3), 2400) // compiling graph...

    const formdata = new FormData()
    formdata.append("resume", resumefile)

    try {
      const result = await axios.post(`${ServerUrl}/api/interview/resume`, formdata, { withCredentials: true })
      
      clearTimeout(timer1)
      clearTimeout(timer2)
      
      setrole(result.data.role || "")
      setexperience(result.data.experience || "")
      setprojects(result.data.projects || [])
      setskills(result.data.skills || [])
      setresumetext(result.data.resumeText || "")
      
      setParseStep(4) // success
      setTimeout(() => {
        setanalyzing(false)
        setWorkflowStep(3)
      }, 800)

    } catch (error) {
      console.error("Resume analysis failed:", error)
      setParseStep(-1) // error state
      setanalyzing(false)
    }
  }

  // Launch interview room
  const handleStart = async () => {
    setloading(true)
    try {
      const result = await axios.post(`${ServerUrl}/api/interview/generate-questions`, {
        role, experience, mode, resumeText: resumetext, projects, skills
      }, { withCredentials: true })

      if (userData) {
        dispatch(setUserData({ ...userData, credits: result.data.creditsLeft }))
      }
      setloading(false)
      onStart({ ...result.data, mode })
    } catch (error) {
      console.error("Failed to generate assessment:", error)
      setloading(false)
    }
  }

  // Skill lists modifiers
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setskills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (index) => {
    setskills(skills.filter((_, idx) => idx !== index))
  }

  const addProject = () => {
    if (newProject.trim() && !projects.includes(newProject.trim())) {
      setprojects([...projects, newProject.trim()])
      setNewProject("")
    }
  }

  const removeProject = (index) => {
    setprojects(projects.filter((_, idx) => idx !== index))
  }

  const stepsList = [
    "Upload File",
    "Analyze Resume",
    "Detected Competencies",
    "Select Track",
    "Launch Session"
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Horizontal workflow steps progress bar */}
      <div className="flex items-center justify-between mb-10 no-print">
        {stepsList.map((stepName, idx) => {
          const stepNum = idx + 1
          const isActive = workflowStep === stepNum
          const isCompleted = workflowStep > stepNum

          return (
            <div key={idx} className="flex-1 flex items-center">
              <div className="flex flex-col items-center relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary-accent text-white border-primary-accent ring-4 ring-primary-accent/15' 
                    : isCompleted 
                      ? 'bg-brand-success text-white border-brand-success' 
                      : 'bg-card-main text-text-secondary border-border-main'
                }`}>
                  {isCompleted ? <BsCheckCircleFill size={12} /> : stepNum}
                </div>
                <span className="text-[10px] font-bold text-text-secondary mt-2 text-center absolute -bottom-6 w-24">
                  {stepName}
                </span>
              </div>
              {idx < stepsList.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                  workflowStep > stepNum ? 'bg-brand-success' : 'bg-border-main'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Spacing correction for absolute label */}
      <div className="h-6" />

      {/* Main setup wizard container card */}
      <div className="bg-card-main border border-border-main rounded-2xl shadow-sm p-8 min-h-[380px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          
          {/* ── STEP 1: RESUME UPLOAD ────────────────────────────────────────── */}
          {workflowStep === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 flex-1 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-black text-text-primary">Verify Candidate Resume</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Upload a PDF resume to initialize the candidate's custom assessment competencies.
                </p>

                <div className="mt-6">
                  <div 
                    onClick={() => document.getElementById("filePicker").click()}
                    className="border-2 border-dashed border-border-main bg-bg-secondary hover:border-primary-accent transition rounded-2xl p-10 text-center cursor-pointer space-y-3"
                  >
                    <BsFileEarmarkArrowUp className="text-4xl mx-auto text-primary-accent" />
                    <input 
                      type="file" 
                      id="filePicker" 
                      accept="application/pdf" 
                      className="hidden" 
                      onChange={(e) => setresumefile(e.target.files[0])} 
                    />
                    <p className="text-sm font-bold text-text-primary">
                      {resumefile ? resumefile.name : "Drag and drop or browse PDF resume"}
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      Max file size: 5MB · PDF files only
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border-main/50 pt-6 mt-6">
                <button
                  onClick={() => {
                    setrole("Software Engineer")
                    setexperience("2 years")
                    setWorkflowStep(3)
                  }}
                  className="text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Configure Manually (Skip Upload)
                </button>
                
                <button
                  disabled={!resumefile}
                  onClick={() => setWorkflowStep(2)}
                  className="flex items-center gap-2 bg-primary-accent text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Analyze Resume <BsArrowRight />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: PARSER LOADER PROGRESS ─────────────────────────────────── */}
          {workflowStep === 2 && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col items-center justify-center py-10 space-y-6"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-border-main border-t-primary-accent rounded-full animate-spin" />
                <BsGearFill className="absolute text-primary-accent animate-pulse" size={20} />
              </div>
              
              <div className="text-center space-y-2 max-w-sm">
                <h3 className="text-base font-bold text-text-primary">Analyzing Resume Credentials</h3>
                <div className="space-y-1.5 text-xs text-text-secondary">
                  <p className={parseStep >= 1 ? "text-brand-success font-semibold" : ""}>
                    {parseStep >= 1 ? "✓" : "○"} Reading PDF structural streams...
                  </p>
                  <p className={parseStep >= 2 ? "text-brand-success font-semibold" : ""}>
                    {parseStep >= 2 ? "✓" : "○"} AI extracting claimed projects & skills...
                  </p>
                  <p className={parseStep >= 3 ? "text-brand-success font-semibold" : ""}>
                    {parseStep >= 3 ? "✓" : "○"} Initiating core competency nodes...
                  </p>
                </div>
              </div>

              {parseStep === -1 && (
                <div className="text-center text-brand-error text-xs flex items-center gap-2 bg-brand-error/10 px-4 py-2 border border-brand-error/20 rounded-xl mt-4">
                  <span>Failed to analyze PDF. Please check file format and size.</span>
                  <button onClick={() => setWorkflowStep(1)} className="font-bold underline">Retry</button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 3: SPECIFY / EDIT COMPETENCIES ───────────────────────────── */}
          {workflowStep === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 flex-1 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-black text-text-primary">Detected Competencies</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Validate the parsed metadata below. Adjust roles, experiences, skills, and projects as required.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Left sub-column: inputs */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Candidate Role</label>
                      <div className="relative">
                        <BsBriefcase className="absolute left-4 top-3.5 text-text-secondary" />
                        <input 
                          type="text" 
                          placeholder="e.g. Software Engineer" 
                          value={role}
                          onChange={(e) => setrole(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 bg-bg-secondary border border-border-main focus:ring-1 focus:ring-primary-accent focus:border-primary-accent outline-none text-xs rounded-xl text-text-primary transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Experience Level</label>
                      <div className="relative">
                        <BsPersonWorkspace className="absolute left-4 top-3.5 text-text-secondary" />
                        <input 
                          type="text" 
                          placeholder="e.g. 3 years" 
                          value={experience}
                          onChange={(e) => setexperience(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 bg-bg-secondary border border-border-main focus:ring-1 focus:ring-primary-accent focus:border-primary-accent outline-none text-xs rounded-xl text-text-primary transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right sub-column: chips list */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Add Custom Skills</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Add skill tag..."
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                          className="flex-1 px-4 py-2 bg-bg-secondary border border-border-main focus:ring-1 focus:ring-primary-accent focus:border-primary-accent outline-none text-xs rounded-xl text-text-primary transition"
                        />
                        <button onClick={addSkill} className="bg-bg-secondary hover:bg-border-main text-text-primary border border-border-main px-4 rounded-xl text-xs font-bold transition cursor-pointer">+</button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto border border-border-main/50 rounded-xl p-2 bg-bg-secondary/40">
                        {skills.length === 0 ? (
                          <span className="text-[10px] text-text-secondary italic">No skills listed. Add some above.</span>
                        ) : (
                          skills.map((s, idx) => (
                            <span key={idx} className="bg-card-main text-text-primary border border-border-main pl-2.5 pr-1.5 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                              {s}
                              <button onClick={() => removeSkill(idx)} className="text-text-secondary hover:text-brand-error cursor-pointer">
                                <BsX size={14} />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Projects list configuration */}
                <div className="mt-4 space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Projects Summary Claims</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add project summary description..."
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addProject()}
                      className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border-main focus:ring-1 focus:ring-primary-accent focus:border-primary-accent outline-none text-xs rounded-xl text-text-primary transition"
                    />
                    <button onClick={addProject} className="bg-bg-secondary hover:bg-border-main text-text-primary border border-border-main px-4 rounded-xl text-xs font-bold transition cursor-pointer">+</button>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto border border-border-main/50 rounded-xl p-2.5 bg-bg-secondary/40 mt-2">
                    {projects.length === 0 ? (
                      <span className="text-[10px] text-text-secondary italic">No projects listed. Add summaries to prompt scenario checks.</span>
                    ) : (
                      projects.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 text-xs bg-card-main border border-border-main p-1.5 rounded-lg">
                          <span className="truncate text-text-secondary font-medium">{p}</span>
                          <button onClick={() => removeProject(idx)} className="text-text-secondary hover:text-brand-error cursor-pointer">
                            <BsX size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border-main/50 pt-6 mt-6">
                <button
                  onClick={() => setWorkflowStep(1)}
                  className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <BsArrowLeft /> Back
                </button>
                <button
                  disabled={!role || !experience}
                  onClick={() => setWorkflowStep(4)}
                  className="flex items-center gap-2 bg-primary-accent text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Choose Mode <BsArrowRight />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: SELECT MODE TRACK ─────────────────────────────────────── */}
          {workflowStep === 4 && (
            <motion.div 
              key="step4" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 flex-1 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-black text-text-primary">Select Assessment Track</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Choose the interview evaluation mode suitable for testing this candidate.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {/* Mode Card: Technical */}
                  <div 
                    onClick={() => setmode("Technical")}
                    className={`border rounded-2xl p-6 cursor-pointer space-y-4 hover:shadow transition duration-200 ${
                      mode === 'Technical' 
                        ? 'border-secondary-accent bg-secondary-accent/5 ring-2 ring-secondary-accent/20' 
                        : 'border-border-main bg-card-main'
                    }`}
                  >
                    <div className="bg-secondary-accent/15 text-secondary-accent w-10 h-10 rounded-xl flex items-center justify-center">
                      <BsCpu size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">Core Technical & CS</h3>
                      <p className="text-[10px] text-text-secondary leading-relaxed mt-1">
                        Interrogates core CS theory, network, operating systems, and system design structures.
                      </p>
                    </div>
                  </div>

                  {/* Mode Card: HR */}
                  <div 
                    onClick={() => setmode("HR")}
                    className={`border rounded-2xl p-6 cursor-pointer space-y-4 hover:shadow transition duration-200 ${
                      mode === 'HR' 
                        ? 'border-primary-accent bg-primary-accent/5 ring-2 ring-primary-accent/20' 
                        : 'border-border-main bg-card-main'
                    }`}
                  >
                    <div className="bg-primary-accent/15 text-primary-accent w-10 h-10 rounded-xl flex items-center justify-center">
                      <BsSliders size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">HR & Behavioral</h3>
                      <p className="text-[10px] text-text-secondary leading-relaxed mt-1">
                        Utilizes behavioral prompts testing STAR elements, conflict resolutions, and culture fits.
                      </p>
                    </div>
                  </div>

                  {/* Mode Card: Coding */}
                  <div 
                    onClick={() => setmode("Coding")}
                    className={`border rounded-2xl p-6 cursor-pointer space-y-4 hover:shadow transition duration-200 ${
                      mode === 'Coding' 
                        ? 'border-brand-success bg-brand-success/5 ring-2 ring-brand-success/20' 
                        : 'border-border-main bg-card-main'
                    }`}
                  >
                    <div className="bg-brand-success/15 text-brand-success w-10 h-10 rounded-xl flex items-center justify-center">
                      <BsCodeSlash size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">Coding & DSA</h3>
                      <p className="text-[10px] text-text-secondary leading-relaxed mt-1">
                        Puzzles algorithm planning, complexity claims, coding edge cases, and code implementation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border-main/50 pt-6 mt-6">
                <button
                  onClick={() => setWorkflowStep(3)}
                  className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <BsArrowLeft /> Back
                </button>
                <button
                  onClick={() => setWorkflowStep(5)}
                  className="flex items-center gap-2 bg-primary-accent text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition cursor-pointer"
                >
                  Next <BsArrowRight />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: FINAL LAUNCH CHECKLIST ─────────────────────────────────── */}
          {workflowStep === 5 && (
            <motion.div 
              key="step5" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 flex-1 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-black text-text-primary">Launch Assessment Rubric</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Confirm the evaluation profile details before launching the assessment engine.
                </p>

                <div className="bg-bg-secondary border border-border-main rounded-xl p-5 mt-6 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-6">
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase">Applied Candidate Role</p>
                      <p className="font-bold text-text-primary mt-0.5">{role}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase">Experience Level</p>
                      <p className="font-bold text-text-primary mt-0.5">{experience}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase">Assessment Mode Track</p>
                      <p className="font-bold text-primary-accent mt-0.5">{mode} Interview</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase">Assessed Capabilities</p>
                      <p className="font-bold text-text-primary mt-0.5">{skills.length} skills · {projects.length} projects</p>
                    </div>
                  </div>

                  <div className="border-t border-border-main/60 pt-4 flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary flex items-center gap-1.5">
                      <LiaCoinsSolid className="text-secondary-accent" size={16} /> Cost per session
                    </span>
                    <span className="font-black text-text-primary">50 Credits</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border-main/50 pt-6 mt-6">
                <button
                  onClick={() => setWorkflowStep(4)}
                  className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <BsArrowLeft /> Back
                </button>
                <button
                  disabled={loading}
                  onClick={handleStart}
                  className="flex items-center gap-2 bg-primary-accent text-white px-8 py-3 rounded-xl text-sm font-bold shadow-sm hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                >
                  <BsFillRocketTakeoffFill /> {loading ? "Launching Engine..." : "Launch Assessment Engine"}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default Step1SetUp