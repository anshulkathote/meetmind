import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import DependencyPage from './pages/DependencyPage'
import AuditPage from './pages/AuditPage'
import SummaryPage from './pages/SummaryPage'
import { MeetingProvider } from './context/MeetingContext'

export default function App() {
  return (
    <MeetingProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"            element={<UploadPage />} />
          <Route path="/dashboard"   element={<DashboardPage />} />
          <Route path="/dependencies" element={<DependencyPage />} />
          <Route path="/audit"       element={<AuditPage />} />
          <Route path="/summary"     element={<SummaryPage />} />
        </Routes>
      </BrowserRouter>
    </MeetingProvider>
  )
}