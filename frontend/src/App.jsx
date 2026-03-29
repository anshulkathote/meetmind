import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MeetingProvider }   from './context/MeetingContext'
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext'
import Navbar                from './components/Navbar'
import LandingPage           from './pages/LandingPage'
import CreateWorkspacePage   from './pages/CreateWorkspacePage'
import JoinWorkspacePage     from './pages/JoinWorkspacePage'
import UploadPage            from './pages/UploadPage'
import DashboardPage         from './pages/DashboardPage'
import DependencyPage        from './pages/DependencyPage'
import AuditPage             from './pages/AuditPage'
import SummaryPage           from './pages/SummaryPage'
import MyTasksPage           from './pages/MyTasksPage'

// Guard — redirects to landing if not in a workspace
function WorkspaceGuard({ children }) {
  const { workspace } = useWorkspace()
  if (!workspace) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { workspace } = useWorkspace()

  return (
    <>
      {workspace && <Navbar />}
      <Routes>
        {/* Public — no workspace needed */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/create"   element={<CreateWorkspacePage />} />
        <Route path="/join"     element={<JoinWorkspacePage />} />

        {/* Protected — workspace required */}
        <Route path="/upload"       element={<WorkspaceGuard><UploadPage /></WorkspaceGuard>} />
        <Route path="/dashboard"    element={<WorkspaceGuard><DashboardPage /></WorkspaceGuard>} />
        <Route path="/dependencies" element={<WorkspaceGuard><DependencyPage /></WorkspaceGuard>} />
        <Route path="/audit"        element={<WorkspaceGuard><AuditPage /></WorkspaceGuard>} />
        <Route path="/summary"      element={<WorkspaceGuard><SummaryPage /></WorkspaceGuard>} />
        <Route path="/my-tasks"     element={<WorkspaceGuard><MyTasksPage /></WorkspaceGuard>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <WorkspaceProvider>
      <MeetingProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </MeetingProvider>
    </WorkspaceProvider>
  )
}