
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from './components/layout/Navbar'
import Hero from './components/layout/Hero'
import Profile from './pages/Profile'
import Concept from './components/layout/Concept'
import Security from './components/layout/Security'
import Premium from './components/layout/Premium'
import Footer from './components/layout/Footer'

import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import ResetPassword from './pages/ResetPassword'
import ComingSoon from './pages/ComingSoon'
import NotFound from './pages/NotFound'
import Discover from './pages/Discover'

import './App.css'

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Concept />
        <Security />
        <Premium />
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />

               <Route path="/discover" element={<Discover />} />

        <Route path="/likes" element={<ComingSoon section="likes" />} />
        <Route path="/messages" element={<ComingSoon section="messages" />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
