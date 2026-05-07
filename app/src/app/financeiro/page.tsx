'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MonthlySummary, Expense, Consultation, ConsultationChannel, formatBRL } from '@/lib/types'

type DrawerType = 'receita' | 'despesas' | 'resultado' | null

interface ConsultationWithPatient extends Consultation {
  patient_name: string
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
  onClose,
  onSaveExpense,
  onSaveConsultation,
  saving,
}: {
  type: DrawerType
  monthLabel: string
  consultations: ConsultationWithPatient[]
  expenses: Expense[]
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
              {type === 'resultado' && (
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide pt-1">Receitas</p>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const [summaries, setSummaries]       = useState<MonthlySummary[]>([])
  const [expenses, setExpenses]         = useState<Expense[]>([])
  const [consultations, setConsultations] = useState<ConsultationWithPatient[]>([])
  const [selected, setSelected]         = useState('')
  const [loading, setLoading]           = useState(true)
  const [drawerType, setDrawerType]     = useState<DrawerType>(null)
  const [saving, setSaving]             = useState(false)

  const [channelData, setChannelData] = useState<{
    online: number; presencial: number; onlineRev: number; presencialRev: number
  }>({ online: 0, presencial: 0, onlineRev: 0, presencialRev: 0 })

  const loadData = useCallback(async () => {
    const [{ data: s }, { data: e }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('monthly_summary').select('*').limit(12),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('consultations').select('*').order('date', { ascending: false }),
      supabase.from('patients').select('id, name'),
    ])

    const months = (s ?? []) as MonthlySummary[]
    setSummaries(months)

    setExpenses((e ?? []) as Expense[])

    const patients = (p ?? []) as { id: string; name: string }[]
    const patientMap = Object.fromEntries(patients.map(pt => [pt.id, pt.name]))
    const cons = (c ?? []) as Consultation[]
    const consWithNames: ConsultationWithPatient[] = cons.map(co => ({
      ...co,
      patient_name: patientMap[co.patient_id] ?? 'Paciente desconhecido',
    }))
    setConsultations(consWithNames)

    setChannelData({
      online:        cons.filter(x => x.channel === 'ONLINE').length,
      presencial:    cons.filter(x => x.channel === 'PRESENCIAL').length,
      onlineRev:     cons.filter(x => x.channel === 'ONLINE').reduce((a, x) => a + x.amount, 0),
      presencialRev: cons.filter(x => x.channel === 'PRESENCIAL').reduce((a, x) => a + x.amount, 0),
    })

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

  const current           = summaries.find(s => s.month === selected)
  const monthExpenses     = expenses.filter(e => e.date.startsWith(selected))
  const monthConsultations = consultations.filter(c => c.date.startsWith(selected))

  function monthLabel(ym: string) {
    const [y, m] = ym.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const totalCons = channelData.online + channelData.presencial || 1

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

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="font-display text-2xl font-bold text-brand-charcoal mb-5">Financeiro</h1>

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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-stone-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : !current ? (
        <p className="text-stone-400 text-center py-12">Nenhum dado disponível</p>
      ) : (
        <>
          {/* Summary cards — each is a clickable button */}
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

          {/* Channel split (overall historical) */}
          <div className="bg-white rounded-2xl p-4 mb-5 border border-stone-100 shadow-sm">
            <p className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wide">Modalidade — histórico total</p>
            <div className="flex gap-4 mb-3">
              <div className="flex-1 text-center">
                <p className="text-xl font-bold text-brand-charcoal">{channelData.presencial}</p>
                <p className="text-xs text-stone-400 mt-0.5">🏥 Presencial</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#318086' }}>{formatBRL(channelData.presencialRev)}</p>
              </div>
              <div className="w-px bg-stone-100" />
              <div className="flex-1 text-center">
                <p className="text-xl font-bold text-brand-charcoal">{channelData.online}</p>
                <p className="text-xs text-stone-400 mt-0.5">💻 Online</p>
                <p className="text-xs font-medium mt-0.5 text-violet-600">{formatBRL(channelData.onlineRev)}</p>
              </div>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${(channelData.presencial / totalCons) * 100}%`, backgroundColor: '#318086' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-stone-400">Presencial {Math.round(channelData.presencial / totalCons * 100)}%</span>
              <span className="text-[10px] text-stone-400">Online {Math.round(channelData.online / totalCons * 100)}%</span>
            </div>
          </div>

          {/* Expense list (quick view, still shown below) */}
          {monthExpenses.length > 0 && (
            <>
              <h2 className="font-bold text-brand-charcoal mb-3">Despesas do mês</h2>
              <div className="space-y-2">
                {monthExpenses.map(e => (
                  <div key={e.id} className="bg-white rounded-xl p-3 border border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand-charcoal capitalize">{e.description}</p>
                      <p className="text-xs text-stone-400">{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="text-rose-500 font-bold text-sm">- {formatBRL(e.amount)}</span>
                  </div>
                ))}
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
          saving={saving}
          onClose={() => setDrawerType(null)}
          onSaveExpense={handleSaveExpense}
          onSaveConsultation={handleSaveConsultation}
        />
      )}
    </div>
  )
}
