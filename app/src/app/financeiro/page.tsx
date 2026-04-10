'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MonthlySummary, Expense, formatBRL } from '@/lib/types'

export default function FinanceiroPage() {
  const [summaries, setSummaries] = useState<MonthlySummary[]>([])
  const [expenses, setExpenses]   = useState<Expense[]>([])
  const [selected, setSelected]   = useState('')
  const [loading, setLoading]     = useState(true)

  // Online vs presencial split
  const [channelData, setChannelData] = useState<{ online: number; presencial: number; onlineRev: number; presencialRev: number }>({
    online: 0, presencial: 0, onlineRev: 0, presencialRev: 0
  })

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: e }, { data: c }] = await Promise.all([
        supabase.from('monthly_summary').select('*').limit(12),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('consultations').select('channel, amount'),
      ])
      const months = (s ?? []) as MonthlySummary[]
      setSummaries(months)
      if (months.length) setSelected(months[0].month)
      setExpenses((e ?? []) as Expense[])
      const cons = (c ?? []) as { channel: string; amount: number }[]
      setChannelData({
        online:      cons.filter(x => x.channel === 'ONLINE').length,
        presencial:  cons.filter(x => x.channel === 'PRESENCIAL').length,
        onlineRev:   cons.filter(x => x.channel === 'ONLINE').reduce((s, x) => s + x.amount, 0),
        presencialRev: cons.filter(x => x.channel === 'PRESENCIAL').reduce((s, x) => s + x.amount, 0),
      })
      setLoading(false)
    }
    load()
  }, [])

  const current      = summaries.find(s => s.month === selected)
  const monthExpenses = expenses.filter(e => e.date.startsWith(selected))

  function monthLabel(ym: string) {
    const [y, m] = ym.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const totalCons = channelData.online + channelData.presencial || 1

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
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-stone-100 rounded-2xl animate-pulse" />)}</div>
      ) : !current ? (
        <p className="text-stone-400 text-center py-12">Nenhum dado disponível</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="space-y-3 mb-5">
            <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#6ac4b7,#318086)' }}>
              <p className="text-xs font-medium opacity-75">Receita de consultas</p>
              <p className="text-3xl font-bold mt-1">{formatBRL(current.revenue)}</p>
              <p className="text-xs opacity-60 mt-0.5">{current.consultation_count} consultas no mês</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
                <p className="text-xs text-stone-400">Despesas</p>
                <p className="text-xl font-bold text-rose-600 mt-1">{formatBRL(current.expenses_total)}</p>
              </div>
              <div className={`rounded-2xl p-4 border shadow-sm ${current.net_income >= 0
                ? 'bg-white border-stone-100' : ''}`}
                style={current.net_income < 0 ? { background: '#ffb8ad20', borderColor: '#ffb8ad60' } : {}}>
                <p className="text-xs text-stone-400">Resultado</p>
                <p className={`text-xl font-bold mt-1 ${current.net_income >= 0 ? '' : 'text-rose-600'}`}
                   style={current.net_income >= 0 ? { color: '#318086' } : {}}>
                  {formatBRL(current.net_income)}
                </p>
              </div>
            </div>
          </div>

          {/* Channel split (overall) */}
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
            {/* Visual bar */}
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${(channelData.presencial / totalCons) * 100}%`, backgroundColor: '#318086' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-stone-400">Presencial {Math.round(channelData.presencial/totalCons*100)}%</span>
              <span className="text-[10px] text-stone-400">Online {Math.round(channelData.online/totalCons*100)}%</span>
            </div>
          </div>

          {/* Expense list */}
          {monthExpenses.length > 0 && (
            <>
              <h2 className="font-bold text-brand-charcoal mb-3">Despesas do mês</h2>
              <div className="space-y-2">
                {monthExpenses.map(e => (
                  <div key={e.id} className="bg-white rounded-xl p-3 border border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand-charcoal capitalize">{e.description}</p>
                      <p className="text-xs text-stone-400">{new Date(e.date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="text-rose-500 font-bold text-sm">- {formatBRL(e.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
