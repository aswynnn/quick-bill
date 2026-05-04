'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { Profile, Client, Invoice } from '@/types/database'
import { generateInvoicePDF } from '@/lib/pdf'
import ClientModal from '@/components/modals/ClientModal'
import InvoiceModal from '@/components/modals/InvoiceModal'
import Toast from '@/components/ui/Toast'

type Filter = 'all' | 'draft' | 'pending' | 'paid'

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Modals
  const [clientModal, setClientModal] = useState<{ open: boolean; client?: Client }>({ open: false })
  const [invoiceModal, setInvoiceModal] = useState<{ open: boolean; invoice?: Invoice }>({ open: false })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const loadData = useCallback(async () => {
    const [profileRes, clientsRes, invoicesRes] = await Promise.all([
      fetch('/api/profile'),
      fetch('/api/clients'),
      fetch('/api/invoices'),
    ])
    const [p, c, i] = await Promise.all([profileRes.json(), clientsRes.json(), invoicesRes.json()])
    setProfile(p)
    setClients(Array.isArray(c) ? c : [])
    setInvoices(Array.isArray(i) ? i : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Stats ────────────────────────────────────────────────────
  const sym = (profile?.currency || 'INR|Rs.').split('|')[1] || 'Rs.'
  const totalBilled = invoices.reduce((a, i) => a + (i.total || 0), 0)
  const pendingCount = invoices.filter((i) => i.status === 'pending').length

  // ── Invoice list filtering ────────────────────────────────────
  const filteredInvoices = invoices
    .filter((i) => !selectedClientId || i.client_id === selectedClientId)
    .filter((i) => filter === 'all' || i.status === filter)
    .filter(
      (i) =>
        !search ||
        (i.num || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.client_name || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // ── Actions ───────────────────────────────────────────────────
  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    setInvoices((prev) => prev.filter((i) => i.id !== id))
    showToast('Invoice deleted.')
  }

  async function togglePaid(inv: Invoice) {
    const newStatus = inv.status === 'paid' ? 'pending' : 'paid'
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const updated = await res.json()
    setInvoices((prev) => prev.map((i) => (i.id === inv.id ? updated : i)))
    showToast(newStatus === 'paid' ? 'Marked as paid!' : 'Marked as pending.')
  }

  async function downloadPDF(inv: Invoice) {
    const client = clients.find((c) => c.id === inv.client_id) || null
    if (!profile) { showToast('Save your profile first.'); return }
    await generateInvoicePDF(inv, profile, client)
    showToast('PDF downloaded!')
  }

  async function deleteClient(id: string) {
    if (!confirm('Delete this client? Their invoices will remain.')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    setClients((prev) => prev.filter((c) => c.id !== id))
    if (selectedClientId === id) setSelectedClientId(null)
    showToast('Client deleted.')
  }

  const avatarColors = ['#1a6bff','#1a9e5c','#d97706','#9333ea','#e03e3e','#0891b2','#be185d','#059669']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your studio…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── NAV ───────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border flex items-center h-14 px-6 gap-0">
        <span className="font-serif text-xl mr-8">
          Studio<span className="text-blue-500">.</span>
        </span>
        <div className="flex gap-1">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#eef3ff] text-[#1a6bff]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </button>
          <Link href="/profile" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-ink-3 hover:bg-gray-100 hover:text-ink-2 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            My Profile
          </Link>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setInvoiceModal({ open: true })}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#1a6bff] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Invoice
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 pb-16 animate-fade-in">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-7">
          <h1 className="font-serif text-3xl tracking-tight">Dashboard</h1>
          <Link href="/profile" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-border-2 rounded-lg text-ink-2 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Edit Profile
          </Link>
        </div>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Invoices', value: invoices.length, sub: 'All time' },
            { label: 'Total Billed', value: `${sym} ${totalBilled.toFixed(0)}`, sub: 'Across all clients' },
            { label: 'Pending', value: pendingCount, sub: 'Awaiting payment' },
            { label: 'Clients', value: clients.length, sub: 'Total clients' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">{s.label}</div>
              <div className="font-serif text-3xl text-ink tracking-tight">{s.value}</div>
              <div className="text-xs text-ink-3 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Clients ────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Clients</span>
            <button
              onClick={() => setClientModal({ open: true })}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-border-2 rounded-lg text-ink-2 hover:bg-gray-50 transition-colors"
            >
              + Add Client
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {clients.map((c) => {
              const invCount = invoices.filter((i) => i.client_id === c.id).length
              const clientTotal = invoices.filter((i) => i.client_id === c.id).reduce((a, i) => a + (i.total || 0), 0)
              const isSelected = selectedClientId === c.id
              return (
                <div
                  key={c.id}
                  className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all group ${
                    isSelected ? 'border-blue-400 bg-[#eef3ff] shadow-md' : 'border-border hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                  onClick={() => setSelectedClientId(isSelected ? null : c.id)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold mb-3"
                    style={{ background: avatarColors[c.color || 0] }}
                  >
                    {(c.company || c.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="text-sm font-semibold text-ink truncate">{c.company || c.name}</div>
                  <div className="text-xs text-ink-3 truncate mb-3">{c.company && c.name ? c.name : ''}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-3">{invCount} inv.</span>
                    <span className="text-xs font-semibold text-ink">{sym} {clientTotal.toFixed(0)}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setClientModal({ open: true, client: c }) }}
                      className="text-xs text-blue-500 hover:underline"
                    >Edit</button>
                    <span className="text-xs text-gray-300">·</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteClient(c.id) }}
                      className="text-xs text-red-400 hover:underline"
                    >Delete</button>
                  </div>
                </div>
              )
            })}
            {/* Add client placeholder */}
            <div
              onClick={() => setClientModal({ open: true })}
              className="border-2 border-dashed border-border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-[#eef3ff] transition-colors min-h-[130px]"
            >
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <span className="text-xs font-semibold text-ink-3">Add Client</span>
            </div>
          </div>
        </div>

        {/* ── Invoices ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
              {selectedClientId
                ? `${clients.find((c) => c.id === selectedClientId)?.company || 'Client'} — Invoices`
                : 'All Invoices'}
            </span>
            <button
              onClick={() => setInvoiceModal({ open: true })}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#1a6bff] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              + New Invoice
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-4">
            {(['all', 'draft', 'pending', 'paid'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                  filter === f
                    ? 'bg-ink text-white'
                    : 'bg-white border border-border-2 text-ink-3 hover:border-blue-300 hover:text-blue-500'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <div className="ml-auto relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices…"
                className="pl-8 pr-3 py-1.5 text-xs border border-border-2 rounded-lg bg-white w-44 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Invoice rows */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16 text-ink-3">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <p className="text-sm">No invoices yet. Create your first one!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredInvoices.map((inv) => {
                const statusStyles = {
                  paid: 'bg-[#edfbf3] text-[#1a9e5c]',
                  pending: 'bg-[#fffbeb] text-[#d97706]',
                  draft: 'bg-gray-100 text-ink-3',
                }
                const d = inv.date
                  ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'
                return (
                  <div
                    key={inv.id}
                    className="bg-white border border-border rounded-xl px-5 py-4 grid items-center gap-3 hover:border-border-2 hover:shadow-sm transition-all"
                    style={{ gridTemplateColumns: '100px 1fr 90px 110px 120px' }}
                  >
                    <span className="text-sm font-semibold text-ink">{inv.num || '—'}</span>
                    <span className="text-sm text-ink-2 truncate">{inv.client_name || '—'}</span>
                    <span className="text-xs text-ink-3">{d}</span>
                    <span className="text-sm font-semibold text-ink text-right">
                      {sym} {(inv.total || 0).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[inv.status]}`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                      {/* Actions */}
                      <button onClick={() => downloadPDF(inv)} title="Download PDF"
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-ink-3 hover:bg-gray-50 hover:text-ink transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </button>
                      <button onClick={() => setInvoiceModal({ open: true, invoice: inv })} title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-ink-3 hover:bg-gray-50 hover:text-ink transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => togglePaid(inv)} title={inv.status === 'paid' ? 'Mark pending' : 'Mark paid'}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:bg-gray-50 transition-colors ${inv.status === 'paid' ? 'text-[#1a9e5c]' : 'text-ink-3'}`}>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                      <button onClick={() => deleteInvoice(inv.id)} title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-red-400 hover:bg-red-50 transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ─────────────────────────────────────────────── */}
      {clientModal.open && (
        <ClientModal
          client={clientModal.client}
          onClose={() => setClientModal({ open: false })}
          onSave={async (data) => {
            if (clientModal.client) {
              const res = await fetch(`/api/clients/${clientModal.client.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
              })
              const updated = await res.json()
              setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
              showToast('Client updated!')
            } else {
              const res = await fetch('/api/clients', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
              })
              const created = await res.json()
              setClients((prev) => [created, ...prev])
              showToast('Client added!')
            }
            setClientModal({ open: false })
          }}
        />
      )}

      {invoiceModal.open && (
        <InvoiceModal
          invoice={invoiceModal.invoice}
          clients={clients}
          profile={profile}
          defaultClientId={selectedClientId}
          onClose={() => setInvoiceModal({ open: false })}
          onSave={async (data) => {
            if (invoiceModal.invoice) {
              const res = await fetch(`/api/invoices/${invoiceModal.invoice.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
              })
              const updated = await res.json()
              setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
              showToast('Invoice updated!')
            } else {
              const res = await fetch('/api/invoices', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
              })
              const created = await res.json()
              setInvoices((prev) => [created, ...prev])
              showToast('Invoice saved!')
            }
            setInvoiceModal({ open: false })
          }}
        />
      )}

      {toast && <Toast message={toast} />}
    </>
  )
}
