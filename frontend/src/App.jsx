import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Threats from './pages/Threats'
import Settings from './pages/Settings'
import ScanDetail from './pages/ScanDetail'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/threats" element={<Threats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/scan/:scanId" element={<ScanDetail />} />
        </Routes>
      </main>
    </div>
  )
}

export default App 