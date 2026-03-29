import { createContext, useContext, useState, useCallback } from 'react'
import { getTasks } from '../api/client'

const MeetingContext = createContext()

export function MeetingProvider({ children }) {
  const [analysisResult, setAnalysisResult] = useState(null)

  const refreshTasks = useCallback(async () => {
    try {
      const res   = await getTasks()
      const fresh = res.data
      setAnalysisResult(prev => {
        if (!prev) return prev
        // Spread into completely new object — forces React to re-render
        return { ...prev, tasks: [...fresh] }
      })
      return fresh
    } catch (e) {
      console.error('Failed to refresh tasks', e)
      return null
    }
  }, [])

  return (
    <MeetingContext.Provider value={{ analysisResult, setAnalysisResult, refreshTasks }}>
      {children}
    </MeetingContext.Provider>
  )
}

export const useMeeting = () => useContext(MeetingContext)