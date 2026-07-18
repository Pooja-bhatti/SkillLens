import React, { useState, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from "./pages/home"
import Auth from './pages/Auth'
import axios from "axios"
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice'
import InterviewPage from './pages/InterviewPage'
import HistoryPage from './pages/HistoryPage'
import PricingPage from './pages/PricingPage'
import AuthGuard from './components/AuthGuard'

export const ServerUrl = "https://skilllens-1h7f.onrender.com"

function App() {
  const dispatch = useDispatch()
  const [appLoading, setAppLoading] = useState(true)

  useEffect(() => {
    const getuser = async () => {
      try {
        // Axios withCredentials defaults are configured globally in main.jsx
        const result = await axios.get(ServerUrl + "/api/user/current-user")
        dispatch(setUserData(result.data))
      } catch (error) {
        dispatch(setUserData(null))
      } finally {
        setAppLoading(false)
      }
    }
    getuser()
  }, [dispatch])

  if (appLoading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center text-text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-border-main border-t-primary-accent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm font-medium">Initializing workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/auth' element={<Auth />} />
      
      {/* Protected Recruiter Routes */}
      <Route path='/interview' element={
        <AuthGuard>
          <InterviewPage />
        </AuthGuard>
      } />
      <Route path='/history' element={
        <AuthGuard>
          <HistoryPage />
        </AuthGuard>
      } />
      <Route path='/pricing' element={
        <AuthGuard>
          <PricingPage />
        </AuthGuard>
      } />
    </Routes>
  )
}
export default App
