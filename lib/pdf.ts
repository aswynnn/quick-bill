'use client'

import type { Invoice, Profile, Client } from '@/types/database'

export async function generateInvoicePDF(
  inv: Invoice,
  profile: Profile,
  client: Client | null
) {
  // Dynamically import jsPDF (client-side only)
  const { jsPDF } = await import('jspdf')
  await import('jspdf-autotable')

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = 595.28
  const H = 841.89
  const lm = 45
  const rm = 45
  const cw = W - lm - rm

  const sym = (profile.currency || 'INR|Rs.').split('|')[1] || 'Rs.'

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, W, H, 'F')

  let y = lm

  // ── Logo + From Info ──────────────────────────────────────
  if (profile.logo_url) {
    try {
      const imgData = await fetchImageAsBase64(profile.logo_url)
      if (imgData) doc.addImage(imgData, 'PNG', lm, y, 80, 80)
    } catch (_) {}

    let ly = y + 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    ;[profile.company, profile.name, profile.gstin, profile.address, profile.city, profile.state]
      .filter(Boolean)
      .forEach((l) => {
        doc.text(l as string, lm + 90, ly)
        ly += 13
      })
  } else {
    let ly = y + 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    ;[profile.company, profile.name, profile.gstin, profile.address, profile.city, profile.state]
      .filter(Boolean)
      .forEach((l) => {
        doc.text(l as string, lm, ly)
        ly += 13
      })
  }

  // Invoice type label — top right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(10, 10, 10)
  doc.text((inv.type || 'INVOICE').toUpperCase(), W - rm, y + 24, { align: 'right' })
  y += 100

  // ── Bill To + Invoice Meta ────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(10, 10, 10)
  doc.text('Bill To:', lm, y)
  y += 16

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(40, 40, 40)

  const toLines = [
    client?.company || client?.name,
    client?.company && client?.name ? client.name : null,
    client?.gstin,
    client?.address,
    [client?.city, client?.state].filter(Boolean).join(', '),
    'India',
  ].filter(Boolean) as string[]

  const billY = y
  toLines.forEach((l) => {
    doc.text(l, lm, y)
    y += 13
  })

  // Meta block — right column
  const metaX = W / 2 + 20
  let my = billY - 16
  const dStr = inv.date
    ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''
  const duStr = inv.due
    ? new Date(inv.due).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  ;[
    ['Invoice#', inv.num || ''],
    ['Invoice Date', dStr],
    ['Due Date', duStr],
  ].forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(10, 10, 10)
    doc.text(lbl, metaX, my)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.text(val, W - rm, my, { align: 'right' })
    my += 18
  })

  y = Math.max(y, my) + 16

  // ── Items Table ───────────────────────────────────────────
  const sg = inv.sgst || 0
  const cg = inv.cgst || 0
  const cs = inv.cess || 0
  const hasGST = sg > 0 || cg > 0 || cs > 0

  type TableColumn = { cellWidth: number | 'auto'; halign?: 'left' | 'center' | 'right'; fontStyle?: 'normal' | 'bold' }

  let head: string[][]
  let body: string[][]
  let colStyles: Record<number, TableColumn>

  if (hasGST) {
    head = [['Item Description', 'Qty', 'Rate', `SGST\n${sg}%`, `CGST\n${cg}%`, 'Amount']]
    body = (inv.items || []).map((it) => {
      const a = it.qty * it.rate
      const tSG = (a * sg) / 100
      const tCG = (a * cg) / 100
      const tCS = (a * cs) / 100
      return [
        it.desc,
        String(it.qty),
        it.rate.toFixed(2),
        tSG.toFixed(2),
        tCG.toFixed(2),
        (a + tSG + tCG + tCS).toFixed(2),
      ]
    })
    colStyles = {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 55, halign: 'right' },
      3: { cellWidth: 55, halign: 'right' },
      4: { cellWidth: 55, halign: 'right' },
      5: { cellWidth: 75, halign: 'right', fontStyle: 'bold' },
    }
  } else {
    head = [['Item Description', 'Qty', 'Rate', 'Amount']]
    body = (inv.items || []).map((it) => [
      it.desc + (it.detail ? '\n' + it.detail : ''),
      String(it.qty),
      it.rate.toFixed(2),
      (it.qty * it.rate).toFixed(2),
    ])
    colStyles = {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 70, halign: 'right' },
      3: { cellWidth: 90, halign: 'right', fontStyle: 'bold' },
    }
  }

  ;(doc as any).autoTable({
    startY: y,
    margin: { left: lm, right: rm },
    head,
    body,
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: { top: 8, bottom: 8, left: 10, right: 10 },
      textColor: [20, 20, 20],
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [10, 10, 10],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: [245, 245, 243] },
    columnStyles: colStyles,
    theme: 'grid',
  })

  y = (doc as any).lastAutoTable.finalY + 20

  // ── Totals ─────────────────────────────────────────────────
  const sub = (inv.items || []).reduce((a, it) => a + it.qty * it.rate, 0)
  const tSG = (sub * sg) / 100
  const tCG = (sub * cg) / 100
  const tCS = (sub * cs) / 100
  const totLX = W - rm - 160
  const totVX = W - rm

  const dtr = (lbl: string, val: string, bold = false, line = false) => {
    if (line) {
      doc.setDrawColor(60, 60, 60)
      doc.setLineWidth(0.5)
      doc.line(totLX, y - 4, totVX, y - 4)
    }
    if (bold) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(10, 10, 10)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
    }
    doc.text(lbl, totLX, y)
    doc.text(val, totVX, y, { align: 'right' })
    y += bold ? 20 : 17
  }

  const fv = (n: number) => `${sym} ${n.toFixed(2)}`

  dtr('Sub Total', fv(sub))
  if (sg > 0) dtr(`SGST (${sg}%)`, fv(tSG))
  if (cg > 0) dtr(`CGST (${cg}%)`, fv(tCG))
  if (cs > 0) dtr(`Cess (${cs}%)`, fv(tCS))
  y += 4
  dtr('TOTAL', fv(sub + tSG + tCG + tCS), true, true)
  y += 24

  // ── Divider ────────────────────────────────────────────────
  doc.setDrawColor(180, 180, 170)
  doc.setLineWidth(0.5)
  doc.line(lm, y, W - rm, y)
  y += 18

  // ── Payment Info + From Address ────────────────────────────
  const payLines = [
    profile.pay_name,
    profile.bank ? 'Bank: ' + profile.bank : null,
    profile.acc ? 'Account No: ' + profile.acc : null,
    profile.ifsc ? 'IFSC : ' + profile.ifsc : null,
    profile.upi ? 'UPI ID :  ' + profile.upi : null,
  ].filter(Boolean) as string[]

  if (payLines.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(10, 10, 10)
    doc.text('Payment Information', lm, y)
    let py = y + 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    payLines.forEach((l) => {
      doc.text(l, lm, py)
      py += 13
    })
  }

  const fromRight = [
    profile.company || profile.name,
    profile.address,
    [profile.city, profile.state].filter(Boolean).join(', '),
    profile.email,
    profile.phone,
  ].filter(Boolean) as string[]

  if (fromRight.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(10, 10, 10)
    doc.text(fromRight[0], W - rm, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    let ry = y + 14
    fromRight.slice(1).forEach((l) => {
      doc.text(l, W - rm, ry, { align: 'right' })
      ry += 13
    })
  }

  y += Math.max(payLines.length, fromRight.length) * 13 + 28
  doc.setDrawColor(180, 180, 170)
  doc.line(lm, y, W - rm, y)
  y += 18

  if (inv.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(10, 10, 10)
    doc.text('Notes', lm, y)
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.text(inv.notes, lm, y, { maxWidth: cw })
    y += 24
  }

  if (inv.terms) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(10, 10, 10)
    doc.text('Terms & Conditions', lm, y)
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.text(inv.terms, lm, y, { maxWidth: cw })
  }

  doc.save(`${inv.num || 'Invoice'}.pdf`)
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
