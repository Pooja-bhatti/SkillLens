import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

function AuthGuard({ children }) {
  const { userData } = useSelector((state) => state.user)

  if (!userData) {
    // If not authenticated, redirect back to the home page
    return <Navigate to="/" replace />
  }

  return children
}

export default AuthGuard
