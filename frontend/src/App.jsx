
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from './components/layout/Navbar'
import Hero from './components/layout/Hero'
import Concept from './components/layout/Concept'
import Security from './components/layout/Security'
import Premium from './components/layout/Premium'
import Footer from './components/layout/Footer'

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

function Login() {
  return <h1>Page de connexion Amoria</h1>
}

function Register() {
  return <h1>Page d'inscription Amoria</h1>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
