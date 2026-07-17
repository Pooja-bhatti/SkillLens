import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from "motion/react"
import { BsBriefcase, BsPersonCircle, BsSliders, BsPlusCircle, BsBarChart } from "react-icons/bs";
import { LiaCoinsSolid } from "react-icons/lia";
import { useNavigate } from 'react-router-dom';
import { IoIosLogOut } from "react-icons/io";
import axios from 'axios';
import { ServerUrl } from '../App';
import { setUserData } from '../redux/userSlice';
import AuthModel from './AuthModel';

function Navbar() {
  const { userData } = useSelector((state) => state.user)
  const [showCreditPopup, setShowCreditPopup] = useState(false)
  const [showUserPopup, setShowUserPopup] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [showAuth, setAuth] = useState(false)
  const currentPath = window.location.pathname

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + "/api/auth/logout", { withCredentials: true })
      dispatch(setUserData(null))
      setShowCreditPopup(false)
      setShowUserPopup(false)
      navigate("/")
    } catch (error) {
      console.log(error)
    }
  }

  // ── RENDER SIDEBAR MODE (IF LOGGED IN) ──────────────────────────────────────
  if (userData) {
    return (
      <div className="w-64 h-screen bg-card-main border-r border-border-main flex flex-col justify-between p-6 fixed left-0 top-0 z-40">
        <div className="flex flex-col flex-1">
          {/* Logo Header */}
          <div className="flex items-center gap-2 cursor-pointer mb-8 px-2" onClick={() => navigate("/")}>
            <span className="font-black text-2xl tracking-tight text-text-primary">
              Skill<span className="text-primary-accent">Lens</span>
            </span>
          </div>

          {/* Navigation Directory */}
          <div className="flex-1 space-y-1.5">
            <button
              onClick={() => navigate("/")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                currentPath === '/' 
                  ? 'bg-bg-secondary text-text-primary border border-border-main/40' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
              }`}
            >
              <BsSliders size={16} className={currentPath === '/' ? 'text-primary-accent' : 'text-text-secondary'} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/interview")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                currentPath === '/interview' 
                  ? 'bg-bg-secondary text-text-primary border border-border-main/40' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
              }`}
            >
              <BsPlusCircle size={16} className={currentPath === '/interview' ? 'text-primary-accent' : 'text-text-secondary'} />
              <span>New Assessment</span>
            </button>

            <button
              onClick={() => navigate("/history")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                currentPath === '/history' 
                  ? 'bg-bg-secondary text-text-primary border border-border-main/40' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
              }`}
            >
              <BsBarChart size={16} className={currentPath === '/history' ? 'text-primary-accent' : 'text-text-secondary'} />
              <span>Analytics & History</span>
            </button>

            <button
              onClick={() => navigate("/pricing")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                currentPath === '/pricing' 
                  ? 'bg-bg-secondary text-text-primary border border-border-main/40' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
              }`}
            >
              <LiaCoinsSolid size={16} className={currentPath === '/pricing' ? 'text-primary-accent' : 'text-text-secondary'} />
              <span>Pricing & Credits</span>
            </button>
          </div>
        </div>

        {/* Footer Accounts Panel */}
        <div className="space-y-4 pt-6 border-t border-border-main/60">
          {/* Credits Summary Capsule */}
          <div className="bg-bg-secondary border border-border-main p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LiaCoinsSolid size={18} className="text-secondary-accent" />
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Available Credits</p>
                <p className="text-sm font-black text-text-primary">{userData?.credits || 0}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/pricing")}
              className="text-xs font-bold text-primary-accent hover:underline cursor-pointer"
            >
              Buy
            </button>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-primary-accent text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                {userData.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{userData.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-text-secondary hover:text-brand-error transition cursor-pointer p-1.5 hover:bg-bg-secondary rounded-lg"
              title="Logout"
            >
              <IoIosLogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── RENDER PUBLIC HEADER MODE (IF LOGGED OUT) ──────────────────────────────────
  return (
    <div className="bg-bg-main flex justify-center px-4 pt-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-6xl bg-card-main rounded-2xl shadow-sm border border-border-main px-8 py-4 flex justify-between items-center relative"
      >
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <span className="font-black text-2xl tracking-tight text-text-primary">
            Skill<span className="text-primary-accent">Lens</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setAuth(true)}
            className="flex items-center gap-2 bg-primary-accent hover:opacity-95 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </motion.div>
      {showAuth && <AuthModel onClose={() => setAuth(false)} />}
    </div>
  )
}

export default Navbar