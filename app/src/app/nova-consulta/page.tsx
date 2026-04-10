'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Patient, type ConsultationChannel } from '@/lib/types'

function NovaConsultaForm() {
  const router = useRouter()
  const params = useSearchParams()
  const preselectedId = params.get('patient') ?? ''

  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch]     = useState('')
  const [showList, setShowList] = useState(false)
  const [form, setForm] = useState({
    patient_id:   preselectedId,
    patient_name: '',
    date:    new Date().toISOString().split('T')[0],
    amount:  '',
    channel: 'PRESENCIAL' as ConsultationChannel,
    notes:   '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    supabase.from('patients').select('id, name, cpf').order('name').then(({ data }) => {
      const list = (data ?? []) as Patient[]
      setPatients(list)
      if (preselectedId) {
        const p = list.find(p => p.id === preselectedId)
        if (p) setForm(f => ({ ...f, patient_name: p.name }))
      }
    })
  }, [preselectedId])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.cpf ?? '').includes(search)
  )

  function selectPatient(p: Patient) {
    setForm(f => ({ ...f, patient_id: p.id, patient_name: p.name }))
    setSearch(''); setShowList(false)
  }

  function formatAmountInput(value: string) {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    const num = parseInt(digits) / 100
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function parseAmount(formatted: string) {
    return parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patient_id) { setError('Selecione um paciente'); return }
    if (!form.amount)     { setError('Informe o valor'); return }
    setLoading(true)
    const { error: err } = await supabase.from('consultations').insert({
      patient_id: form.patient_id,
      date:       form.date,
      amount:     parseAmount(form.amount),
      channel:    form.channel,
      notes:      form.notes.trim() || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/')
  }

  const inputCls = "w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#318086]/40 focus:border-[#318086]"

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="font-display text-2xl font-bold text-brand-charcoal mb-6">Registrar consulta</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Channel toggle ── */}
        <div>
          <label className="block text-sm font-semibold text-stone-600 mb-2">Modalidade *</label>
          <div className="flex gap-2">
            {(['PRESENCIAL', 'ONLINE'] as ConsultationChannel[]).map(ch => {
              const isSelected = form.channel === ch
              const icon  = ch === 'PRESENCIAL' ? '🏥' : '💻'
              const label = ch === 'PRESENCIAL' ? 'Presencial' : 'Online'
              return (
                <button key={ch} type="button"
                  onClick={() => setForm(f => ({ ...f, channel: ch }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all active:scale-[0.97]
                    ${isSelected
                      ? ch === 'PRESENCIAL'
                        ? 'border-[#318086] bg-[#318086] text-white shadow-sm'
                        : 'border-violet-500 bg-violet-500 text-white shadow-sm'
                      : 'border-stone-200 bg-white text-stone-500'
                    }`}>
                  <span className="text-base">{icon}</span>
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Patient picker ── */}
        <div>
          <label className="block text-sm font-semibold text-stone-600 mb-2">Paciente *</label>
          {form.patient_id ? (
            <div className="flex items-center justify-between bg-[#318086]/8 border border-[#318086]/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                     style={{ background: 'linear-gradient(135deg,#6ac4b7,#318086)' }}>
                  {form.patient_name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-brand-charcoal">{form.patient_name}</p>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, patient_id: '', patient_name: '' }))}
                className="text-xs text-stone-400 hover:text-stone-600">Trocar</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" placeholder="Buscar paciente por nome ou CPF…"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowList(true) }}
                onFocus={() => setShowList(true)}
                className={inputCls}
              />
              {showList && search.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-stone-200 rounded-xl mt-1 shadow-lg max-h-52 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-stone-400">
                      Paciente não encontrado.{' '}
                      <button type="button" onClick={() => router.push('/pacientes/novo')}
                        className="font-semibold" style={{ color: '#318086' }}>Cadastrar novo</button>
                    </div>
                  ) : filtered.map(p => (
                    <button key={p.id} type="button" onMouseDown={() => selectPatient(p)}
                      className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0">
                      <p className="text-sm font-medium text-brand-charcoal">{p.name}</p>
                      {p.cpf && <p className="text-xs text-stone-400">{p.cpf}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Date ── */}
        <div>
          <label className="block text-sm font-semibold text-stone-600 mb-2">Data da consulta *</label>
          <input type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className={inputCls} />
        </div>

        {/* ── Amount ── */}
        <div>
          <label className="block text-sm font-semibold text-stone-600 mb-2">Valor (R$) *</label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-stone-400 text-sm font-medium">R$</span>
            <input type="text" placeholder="0,00" inputMode="numeric"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: formatAmountInput(e.target.value) }))}
              className={`${inputCls} pl-10`} />
          </div>
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="block text-sm font-semibold text-stone-600 mb-2">Observações</label>
          <textarea placeholder="Anotações da consulta (opcional)…"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3} className={`${inputCls} resize-none`} />
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-4 text-white rounded-xl font-bold text-base active:opacity-80 disabled:opacity-50 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#6ac4b7,#318086)' }}>
          {loading ? 'Salvando…' : 'Registrar consulta'}
        </button>
      </form>
    </div>
  )
}

export default function NovaConsultaPage() {
  return <Suspense><NovaConsultaForm /></Suspense>
}
