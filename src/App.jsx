import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DailyGridByPartner from './pages/DailyGridByPartner'
import WeeklyGridByAssociate from './pages/WeeklyGridByAssociate'
import MonthlyTeamSummary from './pages/MonthlyTeamSummary'
import SourcerReport from './pages/SourcerReport'
import Submissions from './pages/Submissions'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
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
  )
}
