import { createContext, useContext, useState } from 'react'

const MeetingContext = createContext()

export function MeetingProvider({ children }) {
  const [analysisResult, setAnalysisResult] = useState(null)
  return (
    <MeetingContext.Provider value={{ analysisResult, setAnalysisResult }}>
      {children}
    </MeetingContext.Provider>
  )
}

export const useMeeting = () => useContext(MeetingContext)