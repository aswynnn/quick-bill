'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Profile } from '@/types/database'
import { uploadLogo } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setProfile(data)
          if (data.logo_url) setLogoPreview(data.logo_url)
        }
        setLoading(false)
      })
  }, [])

  const set = (key: keyof Profile, value: string | number) =>
    setProfile((p) => ({ ...p, [key]: value }))

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function saveProfile() {
    setSaving(true)
    let logo_url = profile.logo_url || null

    if (logoFile) {
      const url = await uploadLogo(logoFile)
      if (url) logo_url = url
    }

    const payload = { ...profile, logo_url }
    delete (payload as any).id
    delete (payload as any).created_at
    delete (payload as any).updated_at

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const saved = await res.json()
    setProfile(saved)
    setSaving(false)
    showToast('Profile saved!')
  }

  const Field = ({
    label, id, placeholder, type = 'text', value, onChange,
  }: {
    label: string; id: string; placeholder?: string; type?: string
    value: string; onChange: (v: string) => void
  }) => (
    <div className="flex items-center px-5 border-b border-border last:border-b-0 min-h-[48px] gap-3">
      <span className="text-sm text-ink-2 min-w-[130px] flex-shrink-0">{label}</span>
      <input
        id={id} type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 border-none outline-none text-sm text-ink text-right bg-transparent py-2.5 placeholder:text-gray-300"
      />
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-border flex items-center h-14 px-6">
        <span className="font-serif text-xl mr-8">Studio<span className="text-blue-500">.</span></span>
        <div className="flex gap-1">
          <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-ink-3 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </Link>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#eef3ff] text-[#1a6bff]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            My Profile
          </button>
        </div>
        <div className="ml-auto">
          <button onClick={saveProfile} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-ink text-white rounded-lg hover:bg-ink-2 transition-colors disabled:opacity-60">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
            )}
            Save Profile
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 pb-16 animate-fade-in">
        <div className="mb-7">
          <h1 className="font-serif text-3xl tracking-tight mb-1">My Business Profile</h1>
          <p className="text-sm text-ink-3">Fill this once — your details autofill into every invoice you create.</p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Logo */}
          <div className="col-span-2 bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Logo & Identity</h3>
            </div>
            <div className="flex items-center gap-5 p-5">
              <div
                onClick={() => document.getElementById('logoFileIn')?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-border-2 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 relative overflow-hidden flex-shrink-0"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="absolute inset-0 w-full h-full object-contain" />
                ) : (
                  <>
                    <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className="text-xs font-semibold text-blue-500 mt-1">Upload</span>
                  </>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-2 mb-1">Company Logo</p>
                <p className="text-xs text-ink-3 mb-3">PNG or JPG, 240×240px recommended. Appears on every invoice.</p>
                <div className="flex gap-2">
                  <button onClick={() => document.getElementById('logoFileIn')?.click()}
                    className="px-3 py-1.5 text-xs font-semibold border border-border-2 rounded-lg text-ink-2 hover:bg-gray-50 transition-colors">
                    Choose file
                  </button>
                  {logoPreview && (
                    <button onClick={() => { setLogoPreview(null); setLogoFile(null); set('logo_url', '') }}
                      className="px-3 py-1.5 text-xs font-semibold border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <input type="file" id="logoFileIn" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Business Details</h3>
            </div>
            <Field label="Company Name" id="company" placeholder="Your Company" value={profile.company || ''} onChange={(v) => set('company', v)} />
            <Field label="Your Name" id="name" placeholder="Full Name" value={profile.name || ''} onChange={(v) => set('name', v)} />
            <Field label="GSTIN" id="gstin" placeholder="22AAAAA0000A1Z5" value={profile.gstin || ''} onChange={(v) => set('gstin', v)} />
            <Field label="Invoice Prefix" id="prefix" placeholder="INV-" value={profile.prefix || ''} onChange={(v) => set('prefix', v)} />
          </div>

          {/* Contact */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Contact & Address</h3>
            </div>
            <Field label="Email" id="email" placeholder="you@company.com" value={profile.email || ''} onChange={(v) => set('email', v)} />
            <Field label="Phone" id="phone" placeholder="+91 00000 00000" value={profile.phone || ''} onChange={(v) => set('phone', v)} />
            <Field label="Address" id="address" placeholder="Street, Area" value={profile.address || ''} onChange={(v) => set('address', v)} />
            <Field label="City" id="city" placeholder="City" value={profile.city || ''} onChange={(v) => set('city', v)} />
            <Field label="State" id="state" placeholder="State" value={profile.state || ''} onChange={(v) => set('state', v)} />
          </div>

          {/* Payment */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Payment Details</h3>
            </div>
            <Field label="Account Name" id="payname" placeholder="Account Holder" value={profile.pay_name || ''} onChange={(v) => set('pay_name', v)} />
            <Field label="Bank" id="bank" placeholder="Bank Name" value={profile.bank || ''} onChange={(v) => set('bank', v)} />
            <Field label="Account No." id="acc" placeholder="XXXXXXXXXXXX" value={profile.acc || ''} onChange={(v) => set('acc', v)} />
            <Field label="IFSC" id="ifsc" placeholder="SBIN0000000" value={profile.ifsc || ''} onChange={(v) => set('ifsc', v)} />
            <Field label="UPI ID" id="upi" placeholder="yourname@bank" value={profile.upi || ''} onChange={(v) => set('upi', v)} />
          </div>

          {/* Defaults */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Invoice Defaults</h3>
            </div>
            <div className="flex items-center px-5 border-b border-border min-h-[48px] gap-3">
              <span className="text-sm text-ink-2 min-w-[130px]">Currency</span>
              <select
                value={profile.currency || 'INR|Rs.'}
                onChange={(e) => set('currency', e.target.value)}
                className="flex-1 border-none outline-none text-sm text-ink text-right bg-transparent py-2.5 appearance-none cursor-pointer"
              >
                <option value="INR|Rs.">INR — Rs.</option>
                <option value="USD|USD">USD — $</option>
                <option value="EUR|EUR">EUR — €</option>
                <option value="GBP|GBP">GBP — £</option>
              </select>
            </div>
            <Field label="Default SGST %" id="sgst" type="number" placeholder="6" value={String(profile.sgst ?? '')} onChange={(v) => set('sgst', Number(v))} />
            <Field label="Default CGST %" id="cgst" type="number" placeholder="6" value={String(profile.cgst ?? '')} onChange={(v) => set('cgst', Number(v))} />
            <Field label="Default Notes" id="notes" placeholder="Payment due in 30 days." value={profile.notes || ''} onChange={(v) => set('notes', v)} />
            <Field label="Default Terms" id="terms" placeholder="Pay by due date." value={profile.terms || ''} onChange={(v) => set('terms', v)} />
          </div>

          {/* Save button */}
          <div className="col-span-2 flex justify-end">
            <button onClick={saveProfile} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-ink text-white rounded-xl hover:bg-ink-2 transition-colors disabled:opacity-60">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Save Profile
            </button>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast} />}
    </>
  )
}
