import React from 'react'
import { BsBriefcase } from 'react-icons/bs'

function Footer() {
  return (
    <div className='bg-bg-main flex justify-center px-3 pb-10 py-3 pt-10'>
        <div className='w-full max-w-6xl bg-card-main rounded-2xl shadow-sm border border-border-main py-8 px-8 text-center'>
            <div className='flex justify-center items-center gap-3 mb-3'>
                <div className='bg-primary-accent text-white p-2 rounded-xl'><BsBriefcase size={16}/></div>
                <h2 className='font-semibold text-text-primary'>InterviewIQ</h2>
            </div>
            <p className='text-text-secondary text-sm leading-relaxed max-w-2xl mx-auto'>
            Practice smarter. Speak confidently. Get interview-ready with AI.
            </p>
        </div>
    </div>
  )
}
export default Footer

