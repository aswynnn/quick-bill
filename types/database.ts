export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profile: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
      }
      clients: {
        Row: Client
        Insert: Partial<Client>
        Update: Partial<Client>
      }
      invoices: {
        Row: Invoice
        Insert: Partial<Invoice>
        Update: Partial<Invoice>
      }
    }
  }
}

export interface Profile {
  id: string
  company: string | null
  name: string | null
  gstin: string | null
  prefix: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  pay_name: string | null
  bank: string | null
  acc: string | null
  ifsc: string | null
  upi: string | null
  currency: string | null
  tax: number | null
  sgst: number | null
  cgst: number | null
  notes: string | null
  terms: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  company: string | null
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  gstin: string | null
  color: number | null
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  desc: string
  detail?: string
  qty: number
  rate: number
}

export interface Invoice {
  id: string
  num: string | null
  type: string | null
  date: string | null
  due: string | null
  client_id: string | null
  client_name: string | null
  items: InvoiceItem[]
  sgst: number | null
  cgst: number | null
  cess: number | null
  sub: number | null
  total: number | null
  status: 'draft' | 'pending' | 'paid'
  notes: string | null
  terms: string | null
  created_at: string
  updated_at: string
}
