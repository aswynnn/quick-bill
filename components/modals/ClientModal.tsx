'use client'

import { useState } from 'react'
import type { Client } from '@/types/database'

const AVATAR_COLORS = ['#1a6bff','#1a9e5c','#d97706','#9333ea','#e03e3e','#0891b2','#be185d','#059669']

interface Props {
  client?: Client
  onClose: () => void
  onSave: (data: Partial<Client>) => Promise<void>
}

export default function ClientModal({ client, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    company: client?.company || '',
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    city: client?.city || '',
    state: client?.state || '',
    gstin: client?.gstin || '',
    color: client?.color ?? 0,
  })
  const [saving, setSaving] = useState(false)

  const set = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSave() {
    if (!form.company && !form.name) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="modal-backdrop animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold">{client ? 'Edit Client' : 'Add Client'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-ink-3 hover:bg-gray-200 transition-colors text-lg">×</button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">Client / Company Name</label>
            <input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Nammos Techno Labs"
              className="w-full border border-border-2 rounded-lg px-3 py-2 text-sm text-ink focus:border-blue-400 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">Contact Name</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full Name"
              className="w-full border border-border-2 rounded-lg px-3 py-2 text-sm text-ink focus:border-blue-400 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">Email</label>
              <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="client@email.com"
                className="w-full border border-border-2 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 00000 00000"
                className="w-full border border-border-2 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">Address</label>
            <input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, Area"
              className="w-full border border-border-2 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">City</label>
              <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City"
                className="w-full border border-border-2 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">State</label>
              <input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="State"
                className="w-full border border-border-2 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">GSTIN (optional)</label>
              <input value={form.gstin} onChange={(e) => set('gstin', e.target.value)} placeholder="GSTIN"
                className="w-full border border-border-2 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">Avatar Color</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {AVATAR_COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => set('color', i)}
                    className={`w-7 h-7 rounded-full transition-all ${form.color === i ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-border-2 rounded-lg text-ink-2 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-ink text-white rounded-lg hover:bg-ink-2 transition-colors disabled:opacity-60">
            {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Save Client
          </button>
        </div>
      </div>
    </div>
  )
}
