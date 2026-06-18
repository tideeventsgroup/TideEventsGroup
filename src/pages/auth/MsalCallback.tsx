import React from 'react'
import { Navigate } from 'react-router-dom'

// Popup flow handles auth on the login page directly.
// This route only exists as the registered redirectUri for MSAL internals.
export function MsalCallback() {
  return <Navigate to="/login" replace />
}
