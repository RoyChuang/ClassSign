// 簡易 CSV 匯出（含 UTF-8 BOM，Excel 開中文不亂碼）

function escapeCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  // 含逗號、引號、換行時用引號包起來，內部引號加倍
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(headers: string[], rows: (string | number | boolean | null)[][]): string {
  const lines = [headers.map(escapeCell).join(',')]
  for (const row of rows) lines.push(row.map(escapeCell).join(','))
  return lines.join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
