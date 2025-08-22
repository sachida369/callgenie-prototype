
import React, { useState } from 'react'
import axios from 'axios'

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080'

export default function Wizard() {
  const [csvFile, setCsvFile] = useState(null)
  const [concept, setConcept] = useState('IDFC First Bank – Used Car Loan')
  const [campaignName, setCampaignName] = useState('Used Car Loan Blast')
  const [voiceId, setVoiceId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [cloning, setCloning] = useState(false)

  const uploadCSV = async () => {
    if (!csvFile) return alert('Select CSV first')
    const form = new FormData()
    form.append('file', csvFile)
    const res = await axios.post(`${SERVER}/upload-leads`, form)
    alert(`Uploaded ${res.data.count} leads`)
  }

  const uploadVoice = async (file) => {
    setCloning(true)
    const form = new FormData()
    form.append('name', 'MyVoice')
    form.append('file', file)
    const res = await axios.post(`${SERVER}/voice/clone`, form)
    setVoiceId(res.data.voice_id)
    setCloning(false)
  }

  const startCampaign = async () => {
    const body = {
      name: campaignName,
      concept,
      voice_id: voiceId,
      schedule: { timezone: 'Asia/Kolkata' },
      retryRules: { attempts: 2 }
    }
    const res = await axios.post(`${SERVER}/start-campaign`, body)
    alert('Campaign started: ' + res.data.campaign.name)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="font-semibold mb-3">1) Upload Leads CSV</h2>
        <input type="file" accept=".csv" onChange={e=>setCsvFile(e.target.files[0])} />
        <button className="mt-3 px-3 py-2 bg-black text-white rounded" onClick={uploadCSV}>Upload</button>
      </div>

      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="font-semibold mb-3">2) Campaign Concept</h2>
        <input className="w-full border rounded p-2" value={concept} onChange={e=>setConcept(e.target.value)} />
        <h2 className="font-semibold mt-4 mb-2">Campaign Name</h2>
        <input className="w-full border rounded p-2" value={campaignName} onChange={e=>setCampaignName(e.target.value)} />
      </div>

      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="font-semibold mb-3">3) Clone Voice (upload ~1 minute)</h2>
        <input type="file" accept="audio/*" onChange={e=>uploadVoice(e.target.files[0])} />
        {cloning ? <p>Cloning…</p> : voiceId ? <p className="text-green-600">Voice ready: {voiceId}</p> : null}
      </div>

      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="font-semibold mb-3">4) Start Campaign</h2>
        <button className="px-3 py-2 bg-black text-white rounded" onClick={startCampaign}>Start</button>
      </div>
    </div>
  )
}
