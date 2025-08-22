
import React, { useEffect, useState } from 'react'
import axios from 'axios'

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080'

export default function Dashboard() {
  const [stats, setStats] = useState({ totals:{ total:0, hot:0, warm:0, cold:0}, campaigns:[] })

  const load = async () => {
    const res = await axios.get(`${SERVER}/campaign-stats`)
    setStats(res.data)
  }
  useEffect(()=>{ load(); const t=setInterval(load, 2000); return ()=>clearInterval(t) }, [])

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-4 gap-4">
        <Card title="Total" value={stats.totals.total}/>
        <Card title="Hot" value={stats.totals.hot}/>
        <Card title="Warm" value={stats.totals.warm}/>
        <Card title="Cold" value={stats.totals.cold}/>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="font-semibold mb-2">Recent Campaigns</h3>
        <ul className="list-disc ml-5">
          {stats.campaigns.map(c=>(
            <li key={c.id}>{c.name} — {c.status} — {new Date(c.createdAt).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Card({ title, value }){
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
