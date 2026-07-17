import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FaMicrophone, FaStop, FaKeyboard, FaVolumeUp, FaVolumeMute,
  FaHourglassHalf, FaRegCommentDots, FaBrain, FaCheckCircle,
  FaArrowRight, FaCodeBranch, FaSearch, FaHistory,
  FaChevronRight, FaTerminal
} from 'react-icons/fa';
import { BsBriefcase, BsMic, BsSliders, BsAward, BsPerson, BsPlusCircle } from 'react-icons/bs';
import axios from 'axios';
import { ServerUrl } from '../App';

// Custom mappings for visual styles
const FSM_ORDER = ['EXPLORE', 'VERIFY', 'DEEP_DIVE', 'CLARIFY'];

const DIFFICULTY_LABELS = {
  EXPLORE:   'Easy',
  VERIFY:    'Medium',
  DEEP_DIVE: 'Hard',
  CLARIFY:   'Easy',
  MOVE_ON:   'Easy',
};

const getDifficultyStyle = (diff) => {
  switch (diff?.toLowerCase()) {
    case 'easy':   return 'bg-bg-secondary text-text-secondary border-border-main';
    case 'medium': return 'bg-secondary-accent/15 text-secondary-accent border-secondary-accent/25';
    case 'hard':   return 'bg-primary-accent/15 text-primary-accent border-primary-accent/25';
    default:       return 'bg-bg-secondary text-text-secondary border-border-main';
  }
};

function Step2Interview({ interviewData, onFinish }) {
  const {
    interviewId,
    questions: initialQuestions = [],
    competencyNodes: initialNodes = [],
    mode = 'Technical',
    role = 'Candidate',
    experience = 'Not specified',
    projects: parsedProjects = [],
    skills: parsedSkills = []
  } = interviewData || {};

  const isCoding = mode === 'Coding';
  const isHR     = mode === 'HR';

  // State management
  const [questions, setQuestions]             = useState(initialQuestions);
  const [currentIdx, setCurrentIdx]           = useState(0);
  const [competencyNodes, setCompetencyNodes] = useState(initialNodes);
  const [inputText, setInputText]             = useState('');
  const [isRecording, setIsRecording]         = useState(false);
  const [inputMode, setInputMode]             = useState(isCoding ? 'text' : 'voice');
  const [isMuted, setIsMuted]                 = useState(false);
  const [timeLeft, setTimeLeft]               = useState(isCoding ? 180 : isHR ? 120 : 60);
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [aiFeedback, setAiFeedback]           = useState(null);
  const [semanticScore, setSemanticScore]     = useState(null);
  const [isDone, setIsDone]                   = useState(false);
  const [stopReason, setStopReason]           = useState('');
  const [isFinishing, setIsFinishing]         = useState(false);

  const recognitionRef = useRef(null);
  const timerRef       = useRef(null);
  const currentQuestion = questions[currentIdx] || {};

  const defaultTimeLimit = isCoding ? 180 : isHR ? 120 : 60;

  // Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend   = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Question speech trigger
  useEffect(() => {
    if (currentQuestion.question) {
      setTimeLeft(currentQuestion.timeLimit || defaultTimeLimit);
      setInputText('');
      setAiFeedback(null);
      setSemanticScore(null);
      if (!isMuted && !isCoding) speak(currentQuestion.question);
    }
  }, [currentIdx]);

  // Countdown loop
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isSubmitting && !aiFeedback && !isDone) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { 
            clearInterval(timerRef.current); 
            handleSubmitAnswer(); 
            return 0; 
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [currentIdx, isSubmitting, aiFeedback, isDone]);

  // TTS helper
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsInterviewerSpeaking(true);
      utterance.onend   = () => setIsInterviewerSpeaking(false);
      utterance.onerror = () => setIsInterviewerSpeaking(false);
      const voices = window.speechSynthesis.getVoices();
      const voice  = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMute = () => {
    if (isMuted) { 
      setIsMuted(false); 
      speak(currentQuestion.question); 
    } else { 
      setIsMuted(true); 
      window.speechSynthesis.cancel(); 
      setIsInterviewerSpeaking(false); 
    }
  };

  const startSpeechRecording = () => {
    if (!recognitionRef.current) { 
      alert('Speech recognition is not supported in this browser. Please use keyboard entry.'); 
      return; 
    }
    window.speechSynthesis.cancel();
    setIsInterviewerSpeaking(false);
    try { 
      recognitionRef.current.start(); 
      setIsRecording(true); 
    } catch {}
  };

  const stopSpeechRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  // Answer submission
  const handleSubmitAnswer = async () => {
    if (isRecording) stopSpeechRecording();
    setIsSubmitting(true);
    const limit     = currentQuestion.timeLimit || defaultTimeLimit;
    const timeTaken = limit - timeLeft;

    try {
      const response = await axios.post(
        `${ServerUrl}/api/interview/submit-answer`,
        { interviewId, questionIndex: currentIdx, answer: inputText.trim(), timeTaken },
        { withCredentials: true }
      );

      const { feedback, nextQuestion, done, stopReason: reason, competencyNodes: updatedNodes, score } = response.data;

      setAiFeedback(feedback || 'Answer evaluated.');
      setSemanticScore(score);
      if (updatedNodes) setCompetencyNodes(updatedNodes);

      if (done || !nextQuestion) {
        setIsDone(true);
        setStopReason(reason || 'Assessment complete');
      } else {
        setQuestions(prev => [...prev, nextQuestion]);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setAiFeedback('Evaluation recorded. Proceeding to next concept.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isDone) {
      finishInterview();
    } else if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const finishInterview = async () => {
    setIsFinishing(true);
    try {
      const response = await axios.post(
        `${ServerUrl}/api/interview/finish`,
        { interviewId },
        { withCredentials: true }
      );
      onFinish(response.data);
    } catch (error) {
      console.error('Error finishing interview:', error);
      alert('Failed to finalize the interview scorecard. Please try again.');
    } finally {
      setIsFinishing(false);
    }
  };

  // Derive current concept properties
  const currentNode = competencyNodes.find(n => n.concept === currentQuestion.concept) || {};
  const allEvidence = competencyNodes.flatMap(n => n.evidence || []);

  // Choice Rationale Generator
  const getRationaleText = (state, concept, prevScore) => {
    if (prevScore === null) {
      return `Target concept "${concept}" initialized. Starting FSM traversal in EXPLORE state to calibrate baseline limits.`;
    }
    if (state === 'EXPLORE') {
      return `Previous answer evaluated below target score. FSM reverted to EXPLORE on "${concept}" to re-verify core foundational grasp.`;
    }
    if (state === 'VERIFY') {
      return `Candidate demonstrated core accuracy (Score: ${prevScore}/10). Advancing FSM to VERIFY on "${concept}" to test practical execution.`;
    }
    if (state === 'DEEP_DIVE') {
      return `High accuracy verified (Score: ${prevScore}/10). Activating DEEP_DIVE on "${concept}" to check edge case understanding.`;
    }
    if (state === 'CLARIFY') {
      return `Response struggled with complex criteria (Score: ${prevScore}/10). Transitioned FSM to CLARIFY on "${concept}" to test simpler definitions.`;
    }
    return `Evaluated competency bounds for "${concept}". Moving FSM queue to parse subsequent node weights.`;
  };

  // Finished complete screen
  if (isDone && aiFeedback) {
    return (
      <div className="min-h-screen bg-bg-main py-12 px-4 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl bg-card-main rounded-2xl shadow-sm p-12 flex flex-col items-center text-center border border-border-main"
        >
          <div className="w-20 h-20 rounded-full bg-brand-success/10 flex items-center justify-center mb-6 border border-brand-success/20">
            <FaCheckCircle size={40} className="text-brand-success" />
          </div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight mb-2">Assessment Finished</h2>
          <p className="text-text-secondary text-xs mb-6">{stopReason}</p>
          <div className="bg-bg-secondary border border-border-main rounded-xl p-5 mb-6 w-full text-left">
            <p className="text-[10px] text-primary-accent font-bold uppercase tracking-wider mb-1">AI Evaluator Feedback</p>
            <p className="text-text-secondary italic text-xs leading-relaxed">"{aiFeedback}"</p>
          </div>
          <p className="text-xs text-text-secondary mb-8">
            {questions.length} questions parsed across{' '}
            {new Set(questions.map(q => q.concept).filter(Boolean)).size} competency topics.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={finishInterview}
            disabled={isFinishing}
            className="bg-primary-accent text-white px-10 py-3.5 rounded-xl font-bold shadow-sm hover:bg-opacity-95 transition disabled:opacity-60 flex items-center gap-2 cursor-pointer text-xs"
          >
            {isFinishing
              ? <><span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" /> Finalizing Scorecard...</>
              : 'Generate Detailed Audit Report →'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main p-6 flex items-stretch text-text-primary">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* ── PANEL 1: LEFT PANEL (CANDIDATE SUMMARY & LOGS) ────────────────── */}
        <div className="lg:col-span-3 bg-card-main border border-border-main rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Candidate summary */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Candidate Profile</h3>
              <div className="bg-bg-secondary border border-border-main p-4 rounded-xl space-y-2">
                <div>
                  <p className="text-xs font-black text-text-primary truncate">{role}</p>
                  <p className="text-[10px] text-text-secondary">{experience} Experience</p>
                </div>
                {parsedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {parsedSkills.slice(0, 5).map((s, idx) => (
                      <span key={idx} className="bg-card-main border border-border-main px-1.5 py-0.5 rounded text-[8px] font-bold text-text-secondary">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assessment Focus */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Current Focus</h3>
              <div className="border border-border-main p-4 rounded-xl bg-bg-secondary/40 space-y-1">
                <span className="text-xs font-black text-text-primary flex items-center gap-1.5">
                  <FaBrain size={12} className="text-primary-accent" /> {currentQuestion.concept}
                </span>
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  Topic weight: {currentNode?.weight || 1} · Testing FSM boundary.
                </p>
              </div>
            </div>

            {/* Progress timeline */}
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Question Trail</h3>
              <div className="overflow-y-auto flex-1 pr-1 space-y-3 max-h-[220px]">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isPassed = idx < currentIdx;
                  const score = q.score;

                  return (
                    <div key={idx} className="flex gap-3 text-xs relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                          isCurrent 
                            ? 'bg-primary-accent text-white border-primary-accent ring-2 ring-primary-accent/15' 
                            : isPassed 
                              ? score >= 8 
                                ? 'bg-brand-success text-white border-brand-success' 
                                : score >= 5 
                                  ? 'bg-brand-warning text-white border-brand-warning' 
                                  : 'bg-brand-error text-white border-brand-error'
                              : 'bg-bg-secondary border-border-main text-text-secondary'
                        }`}>
                          {idx + 1}
                        </div>
                        {idx < questions.length - 1 && <div className="w-0.5 h-6 bg-border-main" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold ${isCurrent ? 'text-text-primary' : 'text-text-secondary'} truncate`}>{q.concept}</p>
                        {isPassed && <p className="text-[9px] text-text-secondary font-medium">Score: {score}/10</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-border-main/50 pt-4 mt-6 text-center">
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Interview mode</span>
            <p className="text-xs font-black text-primary-accent mt-0.5">{mode} Track</p>
          </div>
        </div>

        {/* ── PANEL 2: CENTER PANEL (ACTIVE ASSESSMENTS CONSOLE) ─────────────── */}
        <div className="lg:col-span-6 bg-card-main border border-border-main rounded-2xl p-8 flex flex-col justify-between shadow-sm relative">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-main/50 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-accent animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-wider text-text-primary">
                Live Assessment console
              </h2>
            </div>
            
            {/* Hourglass/Timer */}
            <div className="flex items-center gap-2 bg-bg-secondary border border-border-main px-4 py-1.5 rounded-xl shadow-sm">
              <FaHourglassHalf className={timeLeft < 15 ? 'text-brand-error animate-spin' : 'text-text-secondary'} size={14} />
              <span className={`font-mono text-sm font-black ${timeLeft < 15 ? 'text-brand-error animate-pulse' : 'text-text-primary'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Prompt / Question Arena */}
          <div className="my-8 flex-1 flex flex-col justify-center space-y-6">
            <div className="flex gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getDifficultyStyle(currentQuestion.difficulty || DIFFICULTY_LABELS[currentQuestion.fsmState] || 'Easy')}`}>
                {currentQuestion.difficulty || DIFFICULTY_LABELS[currentQuestion.fsmState] || 'Easy'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-bg-secondary text-text-secondary border-border-main uppercase tracking-wider">
                {currentQuestion.concept}
              </span>
            </div>

            <h1 className="text-xl font-extrabold text-text-primary leading-snug">
              "{currentQuestion.question}"
            </h1>

            {/* Answer Interface */}
            {!aiFeedback && (
              <div className="space-y-4">
                
                {/* 💻 CODING INTERACTION PANE */}
                {isCoding && (
                  <div className="rounded-xl overflow-hidden border border-border-main shadow-sm">
                    <div className="bg-bg-secondary px-4 py-2 border-b border-border-main flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-error/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-warning/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-success/60" />
                        <span className="ml-1 text-[10px] text-text-secondary font-mono">pseudocode.py</span>
                      </div>
                      <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider flex items-center gap-1">
                        <FaTerminal /> Input Console
                      </span>
                    </div>
                    <textarea
                      rows={7}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={"# Explain approach and complexity here:\n# 1. Algorithm choice\n# 2. Time/Space limits\n# 3. Code pseudocode..."}
                      className="w-full p-4 bg-[#2B2A28] text-[#FAF8F5] caret-primary-accent font-mono text-xs outline-none resize-none placeholder-text-secondary/50 leading-relaxed"
                    />
                  </div>
                )}

                {/* 🎤🤝 TECHNICAL + HR PANE */}
                {!isCoding && (
                  <div className="space-y-4">
                    <div className="flex bg-bg-secondary p-1 rounded-xl w-fit border border-border-main">
                      <button 
                        onClick={() => { stopSpeechRecording(); setInputMode('voice'); }}
                        className={`flex items-center gap-1.5 px-4 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                          inputMode === 'voice' 
                            ? 'bg-card-main text-primary-accent shadow-sm border border-border-main' 
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <BsMic /> Voice
                      </button>
                      <button 
                        onClick={() => { stopSpeechRecording(); setInputMode('text'); }}
                        className={`flex items-center gap-1.5 px-4 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                          inputMode === 'text' 
                            ? 'bg-card-main text-primary-accent shadow-sm border border-border-main' 
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <FaKeyboard /> Text
                      </button>
                    </div>

                    {inputMode === 'voice' ? (
                      <div className="flex flex-col items-center justify-center bg-bg-secondary border border-dashed border-border-main rounded-xl p-6 min-h-[140px]">
                        {inputText ? (
                          <p className="text-text-primary text-xs leading-relaxed text-center italic max-w-lg mb-4">
                            "{inputText}"
                          </p>
                        ) : (
                          <p className="text-text-secondary text-xs text-center mb-5">
                            {isRecording 
                              ? 'Recording... speak into your microphone.' 
                              : isHR 
                                ? 'Use the STAR method structure.' 
                                : 'Click Start to record answer.'}
                          </p>
                        )}

                        <div className="flex items-center gap-3">
                          {!isRecording ? (
                            <button 
                              onClick={startSpeechRecording} 
                              className="flex items-center gap-2 bg-primary-accent text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition cursor-pointer"
                            >
                              <FaMicrophone /> Start Recording
                            </button>
                          ) : (
                            <button 
                              onClick={stopSpeechRecording} 
                              className="flex items-center gap-2 bg-brand-error text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition cursor-pointer"
                            >
                              <FaStop /> Stop Recording
                            </button>
                          )}
                          <button 
                            onClick={toggleMute} 
                            className="p-2 bg-card-main border border-border-main text-text-secondary rounded-xl hover:bg-bg-secondary cursor-pointer"
                          >
                            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <textarea
                        rows={5}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isHR ? 'Describe the Situation, Task, Action you took, and final Result...' : 'Type response details...'}
                        className="w-full p-4 border border-border-main rounded-xl focus:ring-1 focus:ring-primary-accent focus:border-primary-accent outline-none bg-bg-main text-text-primary text-xs placeholder-text-secondary/50 transition resize-none leading-relaxed"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI feedback panel */}
            {aiFeedback && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-secondary border border-border-main rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-card-main text-primary-accent border border-border-main p-2 rounded-lg mt-0.5">
                    <FaRegCommentDots />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h5 className="font-bold text-text-primary text-xs">AI Evaluation</h5>
                      {semanticScore !== null && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          semanticScore >= 8 
                            ? 'bg-brand-success/15 border-brand-success/20 text-brand-success' 
                            : semanticScore >= 5 
                              ? 'bg-brand-warning/15 border-brand-warning/20 text-brand-warning' 
                              : 'bg-brand-error/15 border-brand-error/20 text-brand-error'
                        }`}>
                          Graded: {semanticScore}/10
                        </span>
                      )}
                    </div>
                    <p className="text-text-secondary italic text-xs leading-relaxed">
                      "{aiFeedback}"
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit / Proceed buttons */}
          <div className="flex justify-end gap-3 border-t border-border-main/50 pt-4">
            {isSubmitting ? (
              <button disabled className="bg-bg-secondary text-text-secondary px-6 py-2.5 border border-border-main rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-not-allowed">
                <span className="w-3 h-3 border-2 border-t-transparent border-primary-accent rounded-full animate-spin" /> Analyzing bounds...
              </button>
            ) : aiFeedback ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-primary-accent text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition cursor-pointer"
              >
                {isDone ? 'Generate Report' : 'Next Question'} <FaArrowRight />
              </button>
            ) : (
              <button 
                disabled={!inputText.trim()} 
                onClick={handleSubmitAnswer}
                className="bg-primary-accent disabled:bg-border-main disabled:text-text-secondary disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition cursor-pointer"
              >
                Submit Answer
              </button>
            )}
          </div>

        </div>

        {/* ── PANEL 3: RIGHT PANEL (AI REASONING DECISION ENGINE) ───────────── */}
        <div className="lg:col-span-3 bg-card-main border border-border-main rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-6 flex-1 flex flex-col">
            
            {/* Pulse Engine Status */}
            <div className="flex items-center justify-between border-b border-border-main/50 pb-3">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Reasoning Engine</span>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-success bg-brand-success/10 border border-brand-success/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-ping" />
                ACTIVE
              </div>
            </div>

            {/* FSM Graph graphic */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">FSM Node Pipeline</h3>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {FSM_ORDER.map((fsmState) => {
                  const isActive = currentQuestion.fsmState === fsmState;
                  return (
                    <div 
                      key={fsmState} 
                      className={`py-2 rounded-lg border text-[8px] font-bold transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary-accent text-white border-primary-accent ring-2 ring-primary-accent/15 scale-105' 
                          : 'bg-bg-secondary text-text-secondary border-border-main/70'
                      }`}
                    >
                      {fsmState}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Topic mastery meters */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Competency Progress</h3>
              <div className="space-y-2.5 bg-bg-secondary/40 border border-border-main p-4 rounded-xl">
                <div>
                  <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                    <span>Topic Mastery</span>
                    <span className="font-bold text-text-primary">{Math.round((currentNode?.mastery || 0) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                    <div 
                      className="h-full bg-brand-success rounded-full transition-all duration-500" 
                      style={{ width: `${Math.round((currentNode?.mastery || 0) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                    <span>Confidence Score</span>
                    <span className="font-bold text-text-primary">{Math.round((currentNode?.confidence || 0) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border-main">
                    <div 
                      className="h-full bg-secondary-accent rounded-full transition-all duration-500" 
                      style={{ width: `${Math.round((currentNode?.confidence || 0) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Selection Rationale text box */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Selection Rationale</h3>
              <div className="bg-[#2B2A28] border border-border-main text-secondary-accent p-3.5 rounded-xl font-mono text-[9px] leading-relaxed">
                <span className="text-[#FAF8F5] font-bold block mb-1">sys_engine_log:</span>
                {getRationaleText(currentQuestion.fsmState, currentQuestion.concept, semanticScore)}
              </div>
            </div>

            {/* Evidence items collected list */}
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Evidence log ({allEvidence.length})</h3>
              <div className="overflow-y-auto flex-1 pr-1 bg-bg-secondary/40 border border-border-main rounded-xl p-3 max-h-[140px] space-y-2 text-[10px]">
                {allEvidence.length === 0 ? (
                  <p className="text-text-secondary italic text-center py-4">Listening for semantic evidence...</p>
                ) : (
                  allEvidence.map((ev, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-text-secondary">
                      <span className="text-brand-success mt-0.5">✓</span>
                      <span className="leading-relaxed">{ev}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Step2Interview;