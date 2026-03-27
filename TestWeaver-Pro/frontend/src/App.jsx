import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { TestProvider } from './contexts/TestContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import TestForm from './components/TestForm'
import StayUpdated from './components/StayUpdated'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <AuthProvider>
      <TestProvider>
        <Router>
          <div className="min-h-screen bg-black">
            <Navbar />
            <Routes>
              <Route path="/" element={
                <>
                  <Hero />
                  <TestForm />
                  <StayUpdated />
                  <Footer />
                </>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />
          </div>
        </Router>
      </TestProvider>
    </AuthProvider>
  )
}

export default App
