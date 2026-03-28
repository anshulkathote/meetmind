import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export const analyzeMeeting  = (data)         => axios.post(`${BASE}/analyze`, data)
export const getTasks        = ()              => axios.get(`${BASE}/tasks`)
export const updateTaskStatus = (id, status)  => axios.patch(`${BASE}/tasks/${id}/status`, { status })
export const getAlerts       = ()              => axios.get(`${BASE}/alerts`)
export const getAudit        = ()              => axios.get(`${BASE}/audit`)
export const healthCheck     = ()              => axios.get(`${BASE}/health`)