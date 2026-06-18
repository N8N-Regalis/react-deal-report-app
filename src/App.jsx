import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DailyGridByPartner from './pages/DailyGridByPartner'
import WeeklyGridByAssociate from './pages/WeeklyGridByAssociate'
import MonthlyTeamSummary from './pages/MonthlyTeamSummary'
import SourcerReport from './pages/SourcerReport'
import Submissions from './pages/Submissions'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="daily-grid" element={<DailyGridByPartner />} />
            <Route path="weekly-grid" element={<WeeklyGridByAssociate />} />
            <Route path="monthly-summary" element={<MonthlyTeamSummary />} />
            <Route path="sourcer-report" element={<SourcerReport />} />
            <Route path="submissions" element={<Submissions />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
