import { createContext, useContext, useState, useCallback } from 'react'
import { getTasks } from '../api/client'
import { useWorkspace } from './WorkspaceContext'

const MeetingContext = createContext()

export function MeetingProvider({ children }) {
  const [analysisResult, setAnalysisResult] = useState(null)
  const { workspace } = useWorkspace()

  const refreshTasks = useCallback(async () => {
    try {
      const workspaceId = workspace?.id || 1
      const res         = await getTasks(workspaceId)
      const fresh       = res.data
      setAnalysisResult(prev => {
        if (!prev) return prev
        return { ...prev, tasks: [...fresh] }
      })
      return fresh
    } catch (e) {
      console.error('Failed to refresh tasks', e)
      return null
    }
  }, [workspace])

  return (
    <MeetingContext.Provider value={{ analysisResult, setAnalysisResult, refreshTasks }}>
      {children}
    </MeetingContext.Provider>
  )
}

export const useMeeting = () => useContext(MeetingContext)