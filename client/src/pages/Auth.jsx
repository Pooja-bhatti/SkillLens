import React from 'react'
import { BsBriefcase } from "react-icons/bs";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import axios from "axios";
import { ServerUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';


function Auth({ isModel = false }) {
    const dispatch = useDispatch()


    const handleGoogleAuth = async () => {
        try {
            const response = await signInWithPopup(auth, provider)
            const idToken = await response.user.getIdToken()
            const result = await axios.post(ServerUrl + "/api/auth/google", { idToken }, { withCredentials: true })
            dispatch(setUserData(result.data))
        }
        catch (error) {
            console.error("Google auth handler error:", error)
            dispatch(setUserData(null))
        }
    }
    return (
        <div className={`w-full ${isModel ? "py-4" : "min-h-screen bg-bg-main flex items-center justify-center px-6 py-20"}`} >
            <motion.div
                onClick={handleGoogleAuth}
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className='w-full max-w-md p-8 rounded-2xl bg-card-main shadow-md border border-border-main'>
                <div className='flex items-center justify-center gap-3 mb-6'>
                    <div className='bg-primary-accent text-white p-2 rounded-xl'>
                        <BsBriefcase size={18} />
                    </div>
                    <h2 className='font-semibold text-lg text-text-primary'>InterviewIQ</h2>
                </div>
                <h1 className='text-2xl md:text-3xl font-semibold text-center text-text-primary leading-snug mb-4'>
                    Continue with
                    <span className='bg-bg-secondary text-primary-accent border border-border-main px-3.5 py-1 rounded-full inline-flex items-center gap-2'>AI Assessment</span>
                </h1>
                <p className='text-text-secondary text-center text-sm md:text-base leading-relaxed mb-8'>Sign in to start your hiring or practice journey</p>
                <motion.button className='w-full flex items-center justify-center gap-3 py-3 bg-card-main border border-border-main text-text-primary hover:bg-bg-secondary hover:border-text-secondary/35 rounded-xl shadow-sm transition-all duration-200 cursor-pointer font-medium'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>
                    <FcGoogle size={20} />
                    Continue with Google
                </motion.button>

            </motion.div>

        </div>
    )
}

export default Auth