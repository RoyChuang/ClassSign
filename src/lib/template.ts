// 班會掛號範本：依班會自訂欄位產生 Excel 空白範本（一單位一 sheet），及解析填好的範本
import * as XLSX from 'xlsx'
import { CustomField, Unit } from '@/lib/types'

// 固定欄位（範本最前面三欄）
const BASE_HEADERS = ['姓名', '性別', '班別'] as const

export interface TemplateRow {
  unit: Unit
  name: string
  gender: string
  className: string
  extra: Record<string, string>
}

// Excel sheet 名稱長度上限 31，且不能含 : \ / ? * [ ]
function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, '_').slice(0, 31)
}

function headersFor(fields: CustomField[]): string[] {
  return [...BASE_HEADERS, ...fields.map(f => f.label)]
}

// 匯出空白範本。units = 要產生的單位 sheet（聯合班會給全部，單位班會給單一）
export function exportTemplate(opts: {
  sessionName: string
  unitName: string | null // 班會所屬單位，null 為聯合
  classNames: string[]
  fields: CustomField[]
  units: Unit[]
}): void {
  const { sessionName, unitName, classNames, fields, units } = opts
  const headers = headersFor(fields)
  const wb = XLSX.utils.book_new()

  for (const unit of units) {
    // 表頭 + 一列班別提示（放在註解列，方便秘書知道有哪些班別）
    const aoa: (string | undefined)[][] = [headers]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    // 欄寬
    ws['!cols'] = headers.map((h, i) => ({ wch: i < 3 ? 12 : Math.max(10, h.length * 2 + 4) }))
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(unit))
  }

  // 說明 sheet：列出可用班別，避免秘書填錯
  const infoAoa = [
    ['班會', sessionName],
    ['類型', unitName ? `單位（${unitName}）` : '聯合'],
    [],
    ['可填班別（請複製到「班別」欄）'],
    ...classNames.map(c => [c]),
  ]
  const infoWs = XLSX.utils.aoa_to_sheet(infoAoa)
  infoWs['!cols'] = [{ wch: 22 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, infoWs, '說明')

  const unitPrefix = unitName ? `${unitName}_` : ''
  XLSX.writeFile(wb, `${unitPrefix}${sessionName}_掛號範本.xlsx`)
}

// 通用：把表頭 + 資料列匯出成單一 sheet 的 .xlsx
export function exportSheet(filename: string, headers: string[], rows: (string | number)[][], sheetName = '工作表1'): void {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map(h => ({ wch: Math.max(8, h.length * 2 + 2) }))
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName(sheetName))
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

// 解析填好的範本。validUnits 為允許的 sheet 名稱（單位），其他 sheet（如「說明」）略過
export async function parseTemplate(
  file: File,
  fields: CustomField[],
  validUnits: Unit[],
): Promise<TemplateRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const unitSet = new Set<string>(validUnits)
  const rows: TemplateRow[] = []

  for (const sheetName of wb.SheetNames) {
    if (!unitSet.has(sheetName)) continue
    const ws = wb.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
    for (const raw of data) {
      const name = String(raw['姓名'] ?? '').trim()
      if (!name) continue // 跳過空列
      const gender = String(raw['性別'] ?? '').trim()
      const className = String(raw['班別'] ?? '').trim()
      const extra: Record<string, string> = {}
      for (const f of fields) {
        const v = raw[f.label]
        const s = v == null ? '' : String(v).trim()
        if (s) extra[f.key] = s
      }
      rows.push({ unit: sheetName as Unit, name, gender, className, extra })
    }
  }
  return rows
}
