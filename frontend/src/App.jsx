import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CourseView from './pages/CourseView'
import CourseCreate from './pages/CourseCreate'
import SyllabusImport from './pages/SyllabusImport'
import ReschedulingWizard from './pages/ReschedulingWizard'
import ReschedulingDashboard from './pages/ReschedulingDashboard'
import Profile from './pages/Profile'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import LoadingSpinner from './components/LoadingSpinner'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return user ? children : <Navigate to="/login" />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return user ? <Navigate to="/dashboard" /> : children
}

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar
                      isOpen={sidebarOpen}
                      onClose={() => setSidebarOpen(false)}
                    />
                    <div className="flex flex-col flex-1 overflow-hidden lg:ml-64">
                      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                      <main className="flex-1 overflow-y-auto p-6">
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/courses" element={<Dashboard />} />
                          <Route path="/courses/create" element={<CourseCreate />} />
                          <Route path="/courses/:id" element={<CourseView />} />
                          <Route path="/courses/:id/import" element={<SyllabusImport />} />
                          <Route path="/courses/:id/reschedule" element={<ReschedulingWizard />} />
                          <Route path="/reschedule" element={<ReschedulingDashboard />} />
                          <Route path="/profile" element={<Profile />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </div>
    </Router>
  )
}

function App() {
  return <AppContent />
}

export default App
