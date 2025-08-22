
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Dashboard from './components/Dashboard.jsx'
import Wizard from './components/Wizard.jsx'

export default function App() {
  const [tab, setTab] = useState('wizard')
  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">CallGenie</h1>
        <nav className="space-x-3">
          <button className={`px-3 py-2 rounded ${tab==='wizard'?'bg-black text-white':'bg-white border'}`} onClick={()=>setTab('wizard')}>Campaign Wizard</button>
          <button className={`px-3 py-2 rounded ${tab==='dashboard'?'bg-black text-white':'bg-white border'}`} onClick={()=>setTab('dashboard')}>Dashboard</button>
        </nav>
      </header>
      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
        {tab==='wizard' ? <Wizard/> : <Dashboard/>}
      </motion.div>
    </div>
  )
}
