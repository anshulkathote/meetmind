import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// ── Meeting analysis ───────────────────────────────────────────────────────
export const analyzeMeeting    = (data)         => axios.post(`${BASE}/analyze`, data)
export const getTasks          = (workspaceId)  => axios.get(`${BASE}/tasks`, { params: { workspace_id: workspaceId || 1 } })
export const updateTaskStatus  = (id, status)   => axios.patch(`${BASE}/tasks/${id}/status`, { status })
export const getAlerts         = (workspaceId)  => axios.get(`${BASE}/alerts`, { params: { workspace_id: workspaceId || 1 } })
export const getAudit          = (workspaceId)  => axios.get(`${BASE}/audit`,  { params: { workspace_id: workspaceId || 1 } })
export const getSummary        = (workspaceId)  => axios.get(`${BASE}/summary`, { params: { workspace_id: workspaceId || 1 } })
export const getDependencies   = (workspaceId)  => axios.get(`${BASE}/dependencies`, { params: { workspace_id: workspaceId || 1 } })
export const healthCheck       = ()             => axios.get(`${BASE}/health`)

// ── Workspace ──────────────────────────────────────────────────────────────
export const createWorkspace   = (name, adminName) => axios.post(`${BASE}/workspace/create`, { name, admin_name: adminName })
export const joinWorkspace     = (code, name)      => axios.post(`${BASE}/workspace/join`,   { code, name })
export const getWorkspace      = (code)            => axios.get(`${BASE}/workspace/${code}`)
export const getMembers        = (code)            => axios.get(`${BASE}/workspace/${code}/members`)
export const getMyTasks        = (code, name)      => axios.get(`${BASE}/workspace/${code}/tasks/mine`, { params: { name } })