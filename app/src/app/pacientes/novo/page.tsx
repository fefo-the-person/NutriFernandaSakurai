'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NovoPacientePage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', cpf: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function formatCPFInput(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11)
    return d.replace(/(\d{3})(\d)/, '$1.$2')
             .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
             .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome obrigatório'); return }
    setLoading(true)
    const cpfClean = form.cpf.replace(/\D/g, '') || null
    const { error: err } = await supabase.from('patients').insert({
      name:  form.name.trim(),
      cpf:   cpfClean,
      notes: form.notes.trim() || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/pacientes')
  }

  const inputCls = "w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#318086]/40 focus:border-[#318086]"

  return (
    <div className="px-4 pt-12 pb-4">
      <button onClick={() => router.back()} className="mb-5 flex items-center gap-1 text-stone-400 text-sm active:opacity-60">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>
      <h1 className="font-display text-2xl font-bold text-brand-charcoal mb-6">Novo paciente</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome completo *">
          <input type="text" placeholder="Ex.: Maria Silva"
            value={form.name} onChange={e => set('name', e.target.value)}
            className={inputCls} autoFocus />
        </Field>

        <Field label="CPF">
          <input type="text" placeholder="000.000.000-00" inputMode="numeric"
            value={formatCPFInput(form.cpf)}
            onChange={e => set('cpf', e.target.value.replace(/\D/g, ''))}
            className={inputCls} />
        </Field>

        <Field label="Observações">
          <textarea placeholder="Alergias, condições especiais, preferências…"
            value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={3} className={`${inputCls} resize-none`} />
        </Field>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-4 text-white rounded-xl font-bold text-base active:opacity-80 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#6ac4b7,#318086)' }}>
          {loading ? 'Salvando…' : 'Salvar paciente'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
