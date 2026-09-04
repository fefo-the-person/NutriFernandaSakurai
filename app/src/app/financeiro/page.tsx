'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MonthlySummary, Expense, Consultation, ConsultationChannel, OtherIncome, formatBRL, formatCPF } from '@/lib/types'

type DrawerType = 'receita' | 'despesas' | 'resultado' | null

const INCOME_CATEGORY_ICON: Record<string, string> = {
  Eventos:   '🎪',
  Palestras: '🎤',
  Aulas:     '📖',
  Livros:    '📚',
  Outro:     '✏️',
}

interface ConsultationWithPatient extends Consultation {
  patient_name: string
  patient_cpf: string | null
}

// ─── Edit forms ───────────────────────────────────────────────────────────────

function EditExpenseForm({
  expense,
  onSave,
  onCancel,
  saving,
}: {
  expense: Expense
  onSave: (e: Expense) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({ ...expense })

  return (
    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Editar despesa</p>

      <div>
        <label className="text-xs text-stone-400">Descrição</label>
        <input
          className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': '#318086' } as React.CSSProperties}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-400">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#318086' } as React.CSSProperties}
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <label className="text-xs text-stone-400">Data</label>
          <input
            type="date"
            className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#318086' } as React.CSSProperties}
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-stone-400">Categoria</label>
        <input
          className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': '#318086' } as React.CSSProperties}
          value={form.category ?? ''}
          onChange={e => setForm(f => ({ ...f, category: e.target.value || null }))}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500 bg-white"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ backgroundColor: '#318086', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function EditConsultationForm({
  consultation,
  onSave,
  onCancel,
  saving,
}: {
  consultation: ConsultationWithPatient
  onSave: (c: ConsultationWithPatient) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({ ...consultation })

  return (
    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Editar consulta</p>
      <p className="text-sm font-medium text-brand-charcoal">{consultation.patient_name}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-400">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#318086' } as React.CSSProperties}
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <label className="text-xs text-stone-400">Data</label>
          <input
            type="date"
            className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#318086' } as React.CSSProperties}
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-stone-400">Modalidade</label>
        <div className="flex gap-2 mt-1">
          {(['PRESENCIAL', 'ONLINE'] as ConsultationChannel[]).map(ch => (
            <button
              key={ch}
              onClick={() => setForm(f => ({ ...f, channel: ch }))}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors
                ${form.channel === ch ? 'text-white border-transparent' : 'bg-white border-stone-200 text-stone-500'}`}
              style={form.channel === ch ? { backgroundColor: '#318086' } : {}}
            >
              {ch === 'PRESENCIAL' ? '🏥 Presencial' : '💻 Online'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-stone-400">Observações</label>
        <textarea
          rows={2}
          className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 resize-none"
          style={{ '--tw-ring-color': '#318086' } as React.CSSProperties}
          value={form.notes ?? ''}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500 bg-white"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ backgroundColor: '#318086', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function Drawer({
  type,
  monthLabel,
  consultations,
  expenses,
  otherIncome,
  onClose,
  onSaveExpense,
  onSaveConsultation,
  saving,
}: {
  type: DrawerType
  monthLabel: string
  consultations: ConsultationWithPatient[]
  expenses: Expense[]
  otherIncome: OtherIncome[]
  onClose: () => void
  onSaveExpense: (e: Expense) => Promise<void>
  onSaveConsultation: (c: ConsultationWithPatient) => Promise<void>
  saving: boolean
}) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingConsultation, setEditingConsultation] = useState<ConsultationWithPatient | null>(null)

  // Lock body scroll while drawer is open (position:fixed prevents macOS rubber-band snap-back)
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  const scrollRef = useRef<HTMLDivElement>(null)
  const sheetRef  = useRef<HTMLDivElement>(null)

  const title =
    type === 'receita'   ? 'Receita de consultas' :
    type === 'despesas'  ? 'Despesas' :
                           'Resultado do mês'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[55]"
        onClick={onClose}
      />

      {/* Sheet — z-[60] sits above BottomNav (z-50) */}
      <div ref={sheetRef} className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
          <div>
            <p className="text-xs text-stone-400">{monthLabel}</p>
            <h2 className="font-bold text-brand-charcoal">{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 text-lg">
            ×
          </button>
        </div>

        {/* Scrollable list — explicit max-height so the browser always has a real scroll boundary */}
        <div
          ref={scrollRef}
          className="overflow-y-auto overscroll-contain px-5 pb-8 space-y-3"
          style={{ maxHeight: 'calc(80vh - 80px)' }}
        >

          {/* ── Receita: list consultations ── */}
          {(type === 'receita' || type === 'resultado') && (
            <>
              {(type === 'resultado' || otherIncome.length > 0) && (
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide pt-1">
                  {type === 'resultado' ? 'Receitas' : 'Consultas'}
                </p>
              )}
              {consultations.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">Nenhuma consulta neste mês</p>
              ) : (
                consultations.map(con => (
                  <div key={con.id}>
                    {editingConsultation?.id === con.id ? (
                      <EditConsultationForm
                        consultation={editingConsultation}
                        saving={saving}
                        onCancel={() => setEditingConsultation(null)}
                        onSave={async updated => {
                          await onSaveConsultation(updated)
                          setEditingConsultation(null)
                        }}
                      />
                    ) : (
                      <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-charcoal truncate">{con.patient_name}</p>
                          <p className="text-xs text-stone-400">
                            {formatCPF(con.patient_cpf)}
                          </p>
                          <p className="text-xs text-stone-400">
                            {new Date(con.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            {' · '}
                            {con.channel === 'PRESENCIAL' ? '🏥 Presencial' : '💻 Online'}
                          </p>
                        </div>
                        <span className="font-bold text-sm flex-shrink-0" style={{ color: '#318086' }}>
                          {formatBRL(con.amount)}
                        </span>
                        <button
                          onClick={() => { setEditingExpense(null); setEditingConsultation(con) }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-500 bg-white flex-shrink-0"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* ── Outras receitas ── */}
          {(type === 'receita' || type === 'resultado') && otherIncome.length > 0 && (
            <>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide pt-2">Outras receitas</p>
              {otherIncome.map(inc => (
                <div key={inc.id} className="bg-stone-50 rounded-2xl p-3 border border-stone-100 flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">
                    {INCOME_CATEGORY_ICON[inc.category] ?? '💰'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-charcoal truncate">{inc.description}</p>
                    <p className="text-xs text-stone-400">
                      {new Date(inc.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {' · '}{inc.category}
                    </p>
                  </div>
                  <span className="font-bold text-sm flex-shrink-0" style={{ color: '#318086' }}>
                    {formatBRL(inc.amount)}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* ── Despesas: list expenses ── */}
          {(type === 'despesas' || type === 'resultado') && (
            <>
              {type === 'resultado' && (
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide pt-2">Despesas</p>
              )}
              {expenses.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">Nenhuma despesa neste mês</p>
              ) : (
                expenses.map(exp => (
                  <div key={exp.id}>
                    {editingExpense?.id === exp.id ? (
                      <EditExpenseForm
                        expense={editingExpense}
                        saving={saving}
                        onCancel={() => setEditingExpense(null)}
                        onSave={async updated => {
                          await onSaveExpense(updated)
                          setEditingExpense(null)
                        }}
                      />
                    ) : (
                      <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-charcoal capitalize truncate">{exp.description}</p>
                          <p className="text-xs text-stone-400">
                            {new Date(exp.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            {exp.category ? ` · ${exp.category}` : ''}
                          </p>
                        </div>
                        <span className="font-bold text-sm text-rose-500 flex-shrink-0">
                          - {formatBRL(exp.amount)}
                        </span>
                        <button
                          onClick={() => { setEditingConsultation(null); setEditingExpense(exp) }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-500 bg-white flex-shrink-0"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Net Income Chart ─────────────────────────────────────────────────────────

function NetIncomeChart({
  summaries,
  consultations,
  selected,
}: {
  summaries: MonthlySummary[]
  consultations: ConsultationWithPatient[]
  selected: string
}) {
  const sorted = [...summaries].sort((a, b) => a.month.localeCompare(b.month))
  if (sorted.length === 0) return null

  // Channel split over the displayed period
  const months12 = new Set(sorted.map(s => s.month))
  const cons12   = consultations.filter(c => months12.has(c.date.slice(0, 7)))
  const total12  = cons12.length || 1
  const presencialPct = Math.round(cons12.filter(c => c.channel === 'PRESENCIAL').length / total12 * 100)
  const onlinePct     = 100 - presencialPct

  // Compact amount label: 1403 → "1,4k", -500 → "-500"
  function fmtShort(v: number): string {
    const abs  = Math.abs(v)
    const sign = v < 0 ? '-' : ''
    if (abs >= 1000) return `${sign}${(abs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
    return `${sign}${Math.round(abs)}`
  }

  // SVG dimensions — padT=22 leaves headroom for amount labels above tallest bar
  const W = 340, H = 165
  const padL = 4, padR = 4, padT = 22, padB = 24
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  const values = sorted.map(s => s.net_income)
  const minVal = Math.min(...values, 0)
  const maxVal = Math.max(...values, 0)
  const range  = maxVal - minVal || 1

  const yFor  = (v: number) => padT + chartH - ((v - minVal) / range) * chartH
  const zeroY = yFor(0)

  const barSlot = chartW / sorted.length
  const barW    = barSlot * 0.55

  return (
    <div className="bg-white rounded-2xl p-4 mb-5 border border-stone-100 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
          Resultado líquido — 12 meses
        </p>
        <div className="text-right space-y-0.5">
          <p className="text-[10px] font-semibold" style={{ color: '#318086' }}>🏢 {presencialPct}% presencial</p>
          <p className="text-[10px] font-semibold text-violet-500">💻 {onlinePct}% online</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Zero baseline */}
        <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="#e7e5e4" strokeWidth="1" />

        {sorted.map((s, i) => {
          const cx   = padL + i * barSlot + barSlot / 2
          const x    = cx - barW / 2
          const v    = s.net_income
          const top  = v >= 0 ? yFor(v) : zeroY
          const bh   = Math.max(Math.abs(yFor(v) - zeroY), 2)
          const fill = v >= 0 ? '#318086' : '#f87171'
          const active = s.month === selected

          const [, mo] = s.month.split('-')
          const label  = new Date(2000, parseInt(mo) - 1)
            .toLocaleDateString('pt-BR', { month: 'short' })
            .replace('.', '')

          // Amount label: above positive bars, below negative bars
          const amtY = v >= 0 ? top - 3 : zeroY + bh + 9

          return (
            <g key={s.month}>
              <rect
                x={x} y={top} width={barW} height={bh}
                fill={fill} rx="3"
                opacity={active ? 1 : 0.35}
              />
              {/* amount label */}
              <text
                x={cx} y={amtY}
                textAnchor="middle" fontSize="7"
                fill={fill}
                opacity={active ? 1 : 0.45}
                fontWeight={active ? '700' : '400'}
              >
                {fmtShort(v)}
              </text>
              {/* tick mark for selected month */}
              {active && (
                <rect x={cx - 1} y={H - padB + 4} width={2} height={3} fill={fill} rx="1" />
              )}
              <text
                x={cx} y={H - 6}
                textAnchor="middle" fontSize="8"
                fill={active ? '#57534e' : '#c4bfbb'}
                fontWeight={active ? '700' : '400'}
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── New vs Returning Patients Chart ─────────────────────────────────────────

function NewVsReturningChart({
  summaries,
  consultations,
  selected,
}: {
  summaries: MonthlySummary[]
  consultations: ConsultationWithPatient[]
  selected: string
}) {
  const sorted = [...summaries].sort((a, b) => a.month.localeCompare(b.month))
  if (sorted.length === 0) return null

  // Build map: patient_id → earliest consultation month
  const firstVisit: Record<string, string> = {}
  for (const c of consultations) {
    const mo = c.date.slice(0, 7)
    if (!firstVisit[c.patient_id] || mo < firstVisit[c.patient_id]) {
      firstVisit[c.patient_id] = mo
    }
  }

  // Per-month counts
  const monthData = sorted.map(s => {
    const seen = new Set(consultations.filter(c => c.date.startsWith(s.month)).map(c => c.patient_id))
    let newPts = 0, returning = 0
    seen.forEach(pid => {
      if (firstVisit[pid] === s.month) newPts++
      else returning++
    })
    return { month: s.month, new: newPts, returning, total: newPts + returning }
  })

  const maxTotal = Math.max(...monthData.map(d => d.total), 1)

  // SVG dims
  const W = 340, H = 155
  const padL = 4, padR = 4, padT = 20, padB = 24
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const barSlot = chartW / sorted.length
  const barW    = barSlot * 0.55

  // Selected-month totals for legend
  const sel = monthData.find(d => d.month === selected) ?? { new: 0, returning: 0, total: 0 }
  const selTotal = sel.total || 1
  const newPct  = Math.round(sel.new / selTotal * 100)
  const retPct  = 100 - newPct

  return (
    <div className="bg-white rounded-2xl p-4 mb-5 border border-stone-100 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
          Pacientes — 12 meses
        </p>
        <div className="text-right space-y-0.5">
          <p className="text-[10px] font-semibold" style={{ color: '#318086' }}>🆕 {newPct}% novos</p>
          <p className="text-[10px] font-semibold text-violet-500">🔄 {retPct}% retorno</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {monthData.map((d, i) => {
          const cx      = padL + i * barSlot + barSlot / 2
          const x       = cx - barW / 2
          const active  = d.month === selected

          const retH  = d.total > 0 ? (d.returning / maxTotal) * chartH : 0
          const newH  = d.total > 0 ? (d.new       / maxTotal) * chartH : 0
          const retY  = padT + chartH - retH - newH
          const newY  = padT + chartH - newH

          const [, mo] = d.month.split('-')
          const label  = new Date(2000, parseInt(mo) - 1)
            .toLocaleDateString('pt-BR', { month: 'short' })
            .replace('.', '')

          return (
            <g key={d.month}>
              {/* Returning segment (bottom, violet) */}
              {retH > 0 && (
                <rect x={x} y={retY} width={barW} height={retH}
                  fill="#7c3aed" rx="2"
                  opacity={active ? 0.75 : 0.2}
                />
              )}
              {/* New segment (top, teal) */}
              {newH > 0 && (
                <rect x={x} y={newY} width={barW} height={newH}
                  fill="#318086" rx="2"
                  opacity={active ? 1 : 0.3}
                />
              )}
              {/* Total count above bar */}
              {d.total > 0 && (
                <text
                  x={cx} y={retY - 3}
                  textAnchor="middle" fontSize="7"
                  fill="#57534e"
                  opacity={active ? 1 : 0.4}
                  fontWeight={active ? '700' : '400'}
                >
                  {d.total}
                </text>
              )}
              {/* Tick for selected */}
              {active && (
                <rect x={cx - 1} y={H - padB + 4} width={2} height={3} fill="#318086" rx="1" />
              )}
              <text
                x={cx} y={H - 6}
                textAnchor="middle" fontSize="8"
                fill={active ? '#57534e' : '#c4bfbb'}
                fontWeight={active ? '700' : '400'}
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Mini legend */}
      <div className="flex gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#318086' }} />
          <span className="text-[10px] text-stone-500">Novos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#7c3aed', opacity: 0.75 }} />
          <span className="text-[10px] text-stone-500">Retorno</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const [summaries, setSummaries]         = useState<MonthlySummary[]>([])
  const [expenses, setExpenses]           = useState<Expense[]>([])
  const [consultations, setConsultations] = useState<ConsultationWithPatient[]>([])
  const [otherIncome, setOtherIncome]     = useState<OtherIncome[]>([])
  const [selected, setSelected]           = useState('')
  const [loading, setLoading]             = useState(true)
  const [drawerType, setDrawerType]       = useState<DrawerType>(null)
  const [saving, setSaving]               = useState(false)


  const loadData = useCallback(async () => {
    const [{ data: s }, { data: e }, { data: c }, { data: p }, { data: oi }] = await Promise.all([
      supabase.from('monthly_summary').select('*').limit(12),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('consultations').select('*').eq('paid', true).order('date', { ascending: false }),
      supabase.from('patients').select('id, name, cpf'),
      supabase.from('other_income').select('*').order('date', { ascending: false }),
    ])

    const months = (s ?? []) as MonthlySummary[]
    setSummaries(months)

    setExpenses((e ?? []) as Expense[])
    setOtherIncome((oi ?? []) as OtherIncome[])

    const patients = (p ?? []) as { id: string; name: string; cpf: string | null }[]
    const patientMap = Object.fromEntries(patients.map(pt => [pt.id, { name: pt.name, cpf: pt.cpf }]))
    const cons = (c ?? []) as Consultation[]
    const consWithNames: ConsultationWithPatient[] = cons.map(co => ({
      ...co,
      patient_name: patientMap[co.patient_id]?.name ?? 'Paciente desconhecido',
      patient_cpf:  patientMap[co.patient_id]?.cpf ?? null,
    }))
    setConsultations(consWithNames)

    return months
  }, [])

  useEffect(() => {
    async function init() {
      const months = await loadData()
      if (months.length) setSelected(months[0].month)
      setLoading(false)
    }
    init()
  }, [loadData])

  const current             = summaries.find(s => s.month === selected)
  const monthExpenses       = expenses.filter(e => e.date.startsWith(selected))
  const monthConsultations  = consultations.filter(c => c.date.startsWith(selected))
  const monthOtherIncome    = otherIncome.filter(i => i.date.startsWith(selected))

  function monthLabel(ym: string) {
    const [y, m] = ym.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  async function handleSaveExpense(exp: Expense) {
    setSaving(true)
    await supabase.from('expenses').update({
      date:        exp.date,
      description: exp.description,
      amount:      exp.amount,
      category:    exp.category,
    }).eq('id', exp.id)
    await loadData()
    setSaving(false)
  }

  async function handleSaveConsultation(con: ConsultationWithPatient) {
    setSaving(true)
    await supabase.from('consultations').update({
      date:    con.date,
      amount:  con.amount,
      channel: con.channel,
      notes:   con.notes,
    }).eq('id', con.id)
    await loadData()
    setSaving(false)
  }

  // Month stats derived from consultations
  const monthPatientIds   = new Set(monthConsultations.map(c => c.patient_id))
  const firstVisitMap: Record<string, string> = {}
  for (const c of consultations) {
    const mo = c.date.slice(0, 7)
    if (!firstVisitMap[c.patient_id] || mo < firstVisitMap[c.patient_id]) {
      firstVisitMap[c.patient_id] = mo
    }
  }
  const monthPatientIdsArr  = Array.from(monthPatientIds)
  const newPatientCount     = monthPatientIdsArr.filter(pid => firstVisitMap[pid] === selected).length
  const totalPatientCount   = monthPatientIdsArr.length

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="font-display text-2xl font-bold text-brand-charcoal mb-5">Financeiro</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-stone-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* 12-month net income chart — above month selector */}
          <NetIncomeChart
            summaries={summaries}
            consultations={consultations}
            selected={selected}
          />

          {/* New vs returning patients chart */}
          <NewVsReturningChart
            summaries={summaries}
            consultations={consultations}
            selected={selected}
          />

          {/* Month selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {summaries.map(s => (
              <button key={s.month} onClick={() => setSelected(s.month)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${selected === s.month ? 'text-white' : 'bg-white text-stone-500 border border-stone-200'}`}
                style={selected === s.month ? { backgroundColor: '#318086' } : {}}>
                {monthLabel(s.month)}
              </button>
            ))}
          </div>

          {!current ? (
            <p className="text-stone-400 text-center py-12">Nenhum dado disponível</p>
          ) : (
            <>
              {/* Summary cards */}
              <div className="space-y-3 mb-5">

                {/* Resultado — big card on top */}
                <button
                  onClick={() => setDrawerType('resultado')}
                  className="w-full text-left rounded-2xl p-4 text-white active:scale-[0.98] transition-transform"
                  style={
                    current.net_income >= 0
                      ? { background: 'linear-gradient(135deg,#6ac4b7,#318086)' }
                      : { background: 'linear-gradient(135deg,#ffb8ad,#e07070)' }
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-75">Resultado líquido</p>
                      <p className="text-3xl font-bold mt-1">{formatBRL(current.net_income)}</p>
                      <p className="text-xs opacity-60 mt-0.5">{current.consultation_count} consultas no mês</p>
                    </div>
                    <span className="opacity-50 text-xl leading-none">›</span>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  {/* Receita */}
                  <button
                    onClick={() => setDrawerType('receita')}
                    className="text-left bg-white rounded-2xl p-4 border border-stone-100 shadow-sm active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-stone-400">Receitas</p>
                        <p className="text-xl font-bold mt-1" style={{ color: '#318086' }}>{formatBRL(current.revenue)}</p>
                      </div>
                      <span className="text-stone-300 text-xl leading-none">›</span>
                    </div>
                  </button>

                  {/* Despesas */}
                  <button
                    onClick={() => setDrawerType('despesas')}
                    className="text-left bg-white rounded-2xl p-4 border border-stone-100 shadow-sm active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-stone-400">Despesas</p>
                        <p className="text-xl font-bold text-rose-600 mt-1">{formatBRL(current.expenses_total)}</p>
                      </div>
                      <span className="text-stone-300 text-xl leading-none">›</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Month stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm text-center">
                  <p className="text-2xl font-bold" style={{ color: '#318086' }}>{monthConsultations.length}</p>
                  <p className="text-xs text-stone-400 mt-1 leading-tight">Consultas</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm text-center">
                  <p className="text-2xl font-bold text-brand-charcoal">{totalPatientCount}</p>
                  <p className="text-xs text-stone-400 mt-1 leading-tight">Pacientes</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm text-center">
                  <p className="text-2xl font-bold text-brand-charcoal">{newPatientCount}</p>
                  <p className="text-xs text-stone-400 mt-1 leading-tight">
                    Novos
                    {totalPatientCount > 0 && (
                      <><br /><span className="font-semibold" style={{ color: '#318086' }}>{Math.round(newPatientCount / totalPatientCount * 100)}%</span></>
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Slide-up drawer */}
      {drawerType && (
        <Drawer
          type={drawerType}
          monthLabel={monthLabel(selected)}
          consultations={monthConsultations}
          expenses={monthExpenses}
          otherIncome={monthOtherIncome}
          saving={saving}
          onClose={() => setDrawerType(null)}
          onSaveExpense={handleSaveExpense}
          onSaveConsultation={handleSaveConsultation}
        />
      )}
    </div>
  )
}
