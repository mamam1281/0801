"use client"
import { useEffect, useState } from 'react'
import apiRequest, { setTokens, clearTokens } from '@/utils/api'

export default function SmokeRefreshPage() {
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        // Force bad token to trigger 401 -> refresh flow (assumes valid refresh in localStorage if present)
        setTokens('invalid-access', 'invalid-refresh')
        await apiRequest('/auth/me')
        setMsg('OK: auto refresh + retry succeeded (or endpoint allowed)')
      } catch (e: any) {
        setMsg('Handled error: ' + (e?.message || 'unknown'))
      }
    }
    run()
    return () => clearTokens()
  }, [])

  return (
    <div style={{padding:20}}>
      <h1>UI Smoke: Auto-Refresh</h1>
      <p>{msg}</p>
    </div>
  )
}
