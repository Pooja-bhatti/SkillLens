import React, { useState } from 'react'
import Navbar from '../components/Navbar';
import Step1SetUp from '../components/Step1SetUp';
import Step2Interview from '../components/Step2Interview';
import Step3Report from '../components/Step3Report';

function InterviewPage() {
  const [step, setstep] = useState(1);
  const [interviewData, setinterviewData] = useState(null)

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      {/* Sidebar visible on setup (1) and report (3) modes */}
      {step !== 2 && <Navbar />}

      <div className={step !== 2 ? "pl-64 min-h-screen" : "min-h-screen"}>
        {step === 1 && (
          <Step1SetUp onStart={(data) => {
            setinterviewData(data);
            setstep(2);
          }} />
        )}
        {step === 2 && (
          <Step2Interview 
            interviewData={interviewData}
            onFinish={(report) => {
              setinterviewData(report);
              setstep(3);
            }} 
          />
        )}
        {step === 3 && (
          <Step3Report report={interviewData} />
        )}
      </div>
    </div>
  )
}

export default InterviewPage