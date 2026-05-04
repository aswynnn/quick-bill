'use client'

import { useState, useEffect } from 'react'
import type { Client, Invoice, Profile, InvoiceItem } from '@/types/database'

interface Props {
  invoice?: Invoice
  clients: Client[]
  profile: Profile | null
  defaultClientId?: string | null
  onClose: () => void
  onSave: (data: Partial<Invoice>) => Promise<void>
}

const emptyItem = (): InvoiceItem => ({ desc: '', qty: 1, rate: 0 })

export default function InvoiceModal({ invoice, clients, profile, defaultClientId, onClose, onSave }: Props) {
  const [clientId, setClientId] = useState(invoice?.client_id || defaultClientId || '')
  const [num, setNum] = useState(invoice?.num || '')
  const [type, setType] = useState(invoice?.type || 'Invoice')
  const [date, setDate] = useState(invoice?.date || new Date().toISOString().split('T')[0])
  const [due, setDue] = useState(invoice?.due || '')
  const [status, setStatus] = useState<Invoice['status']>(invoice?.status || 'pending')
  const [sgst, setSgst] = useState(invoice?.sgst ?? profile?.sgst ?? 0)
  const [cgst, setCgst] = useState(invoice?.cgst ?? profile?.cgst ?? 0)
  const [cess, setCess] = useState(invoice?.cess ?? 0)
  const [notes, setNotes] = useState(invoice?.notes || profile?.notes || '')
  const [terms, setTerms] = useState(invoice?.terms || profile?.terms || '')
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items?.length ? invoice.items : [emptyItem()])
  const [saving, setSaving] = useState(false)

  const sym = (profile?.currency || 'INR|Rs.').split('|')[1] || 'Rs.'

  // Auto-set due date (30 days from date)
  useEffect(() => {
    if (!invoice?.due && date) {
      const d = new Date(date)
      d.setDate(d.getDate() + 30)
      setDue(d.toISOString().split('T')[0])
    }
  }, [date, invoice?.due])

  // Auto-increment invoice number
  useEffect(() => {
    if (!invoice && profile?.prefix) {
      setNum(`${profile.prefix}001`)
    }
  }, [invoice, profile])

  const sub = items.reduce((a, it) => a + it.qty * it.rate, 0)
  const tSG = (sub * Number(sgst)) / 100
  const tCG = (sub * Number(cgst)) / 100
  const tCS = (sub * Number(cess)) / 100
  const total = sub + tSG + tCG + tCS

  const updateItem = (i: number, key: keyof InvoiceItem, value: string | number) => {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [key]: value } : it))
  }
  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (i: number) => { if (items.length > 1) setItems((prev) => prev.filter((_, idx) => idx !== i)) }

  async function handleSave(overrideStatus?: Invoice['status']) {
    setSaving(true)
    const client = clients.find((c) => c.id === clientId)
    const payload: Partial<Invoice> = {
      num, type, date, due, status: overrideStatus || status,
      client_id: clientId || null,
      client_name: client ? (client.company || client.name || '') : '',
      items, sgst: Number(sgst), cgst: Number(cgst), cess: Number(cess),
      sub, total, notes, terms,
    }
    await onSave(payload)
    setSaving(false)
  }

  const inputCls = "w-full border border-[#D0CEC7] rounded-lg px-3 py-2 text-sm text-[#0D0D0D] focus:border-blue-400 outline-none font-sans"
  const labelCls = "block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1.5"

  return (
    <div className="modal-backdrop animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold">{invoice ? 'Edit Invoice' : 'New Invoice'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-[#6B6B6B] hover:bg-gray-200 transition-colors text-lg">×</button>
        </div>

        <div className="overflow-y-auto max-h-[72vh]">
          {/* Invoice Info */}
          <div className="p-6 border-b border-border space-y-4">
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Invoice Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Client</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls + ' appearance-none cursor-pointer'}>
                  <option value="">— Select Client —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Invoice #</label>
                <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="INV-001" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Due Date</label>
                <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls + ' appearance-none cursor-pointer'}>
                  <option>Invoice</option>
                  <option>Tax Invoice</option>
                  <option>Receipt</option>
                  <option>Proforma Invoice</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as Invoice['status'])} className={inputCls + ' appearance-none cursor-pointer'}>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tax Settings */}
          <div className="p-6 border-b border-border">
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Tax Settings</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>SGST %</label>
                <input type="number" min="0" value={sgst} onChange={(e) => setSgst(Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CGST %</label>
                <input type="number" min="0" value={cgst} onChange={(e) => setCgst(Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cess %</label>
                <input type="number" min="0" value={cess} onChange={(e) => setCess(Number(e.target.value))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="p-6 border-b border-border">
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">Line Items</p>
            <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: '1fr 60px 90px 90px 28px' }}>
              {['Description','Qty','Rate','Amount',''].map((h) => (
                <span key={h} className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid gap-2 mb-2 items-center" style={{ gridTemplateColumns: '1fr 60px 90px 90px 28px' }}>
                <input
                  value={it.desc} placeholder="Item name / details"
                  onChange={(e) => updateItem(i, 'desc', e.target.value)}
                  className="border border-[#D0CEC7] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                />
                <input
                  type="number" min="0" value={it.qty}
                  onChange={(e) => updateItem(i, 'qty', parseFloat(e.target.value) || 0)}
                  className="border border-[#D0CEC7] rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:border-blue-400"
                />
                <input
                  type="number" min="0" value={it.rate}
                  onChange={(e) => updateItem(i, 'rate', parseFloat(e.target.value) || 0)}
                  className="border border-[#D0CEC7] rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:border-blue-400"
                />
                <input
                  readOnly value={`${sym} ${(it.qty * it.rate).toFixed(2)}`}
                  className="border border-[#D0CEC7] rounded-lg px-2 py-1.5 text-sm text-right bg-gray-50 text-[#6B6B6B] outline-none"
                />
                <button onClick={() => removeItem(i)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-base">
                  −
                </button>
              </div>
            ))}
            <button onClick={addItem} className="text-xs font-semibold text-blue-500 hover:text-blue-600 mt-1 transition-colors">
              + Add Line Item
            </button>
          </div>

          {/* Totals */}
          <div className="p-6 bg-gray-50 border-b border-border space-y-1.5">
            <div className="flex justify-between text-sm text-[#6B6B6B]">
              <span>Sub Total</span><span>{sym} {sub.toFixed(2)}</span>
            </div>
            {Number(sgst) > 0 && <div className="flex justify-between text-sm text-[#6B6B6B]"><span>SGST ({sgst}%)</span><span>{sym} {tSG.toFixed(2)}</span></div>}
            {Number(cgst) > 0 && <div className="flex justify-between text-sm text-[#6B6B6B]"><span>CGST ({cgst}%)</span><span>{sym} {tCG.toFixed(2)}</span></div>}
            {Number(cess) > 0 && <div className="flex justify-between text-sm text-[#6B6B6B]"><span>Cess ({cess}%)</span><span>{sym} {tCS.toFixed(2)}</span></div>}
            <div className="flex justify-between text-base font-bold text-[#0D0D0D] border-t border-[#D0CEC7] pt-2 mt-2">
              <span>TOTAL</span><span>{sym} {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="p-6 space-y-4">
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Notes & Terms</p>
            <div>
              <label className={labelCls}>Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment due within 30 days." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Terms & Conditions</label>
              <input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Please make the payment by the due date." className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-[#D0CEC7] rounded-lg text-[#3A3A3A] hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => handleSave('draft')} disabled={saving}
            className="px-4 py-2 text-sm font-medium border border-[#D0CEC7] rounded-lg text-[#3A3A3A] hover:bg-gray-50 transition-colors">
            Save Draft
          </button>
          <button onClick={() => handleSave()} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#0D0D0D] text-white rounded-lg hover:bg-[#3A3A3A] transition-colors disabled:opacity-60">
            {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Save Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
