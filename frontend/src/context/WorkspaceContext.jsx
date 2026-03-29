import { createContext, useContext, useState, useEffect } from 'react'

const WorkspaceContext = createContext()

const STORAGE_KEY = 'meetmind_workspace'

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspaceState] = useState(null)
  // workspace shape:
  // { id, code, name, admin_name, memberName, role }

  // Load from localStorage on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setWorkspaceState(JSON.parse(saved))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  function setWorkspace(data) {
    setWorkspaceState(data)
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    else localStorage.removeItem(STORAGE_KEY)
  }

  function leaveWorkspace() {
    setWorkspace(null)
  }

  const isAdmin = workspace?.role === 'admin'

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, leaveWorkspace, isAdmin }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => useContext(WorkspaceContext)