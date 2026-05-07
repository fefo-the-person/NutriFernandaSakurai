'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const PRESET_CATEGORIES = [
  { label: 'Aluguel',        icon: '🏠', description: 'Aluguel do consultório' },
  { label: 'Vivo',           icon: '📱', description: 'Conta de telefone/internet' },
  { label: 'DARF',           icon: '📋', description: 'Imposto / Simples Nacional' },
  { label: 'Enel',           icon: '⚡', description: 'Conta de luz' },
  { label: 'CCAFE',          icon: '🎓', description: 'Anuidade / taxa do conselho' },
  { label: 'Clube do livro', icon: '📚', description: 'Assinatura clube do livro' },
  { label: 'Outro',          icon: '✏️', description: 'Outra despesa' },
]

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseAmount(formatted: string) {
  return parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0
}

export default function NovaDespesaPage() {
  const router = useRouter()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [customDescription, setCustomDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isOutro = selectedCategory === 'Outro'
  const description = isOutro ? customDescription : (selectedCategory ?? '')

  const inputCls = "w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#318086]/40 focus:border-[#318086]"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCategory) { setError('Selecione uma categoria'); return }
    if (isOutro && !customDescription.trim()) { setError('Descreva a despesa'); return }
    if (!amount) { setError('Informe o valor'); return }

    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('expenses').insert({
      date,
      category:    selectedCategory,
      description: description.trim(),
      amount:      parseAmount(amount),
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/financeiro')
  }

  return (
    <div className="px-4 pt-12 pb-8">
      {/* Header */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-400 mb-5">
        <span className="text-lg leading-none">‹</span> Voltar
      </button>
      <h1 className="font-display text-2xl font-bold text-brand-charcoal mb-1">Nova despesa</h1>
      <p className="text-sm text-stone-400 mb-7">Selecione a categoria e informe o valor</p>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Category chips */}
        <div>
          <label className="block text-sm font-semibold text-stone-600 mb-3">Categoria *</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_CATEGORIES.map(cat => {
              const selected = selectedCategory === cat.label
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => { setSelectedCategory(cat.label); setError('') }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all active:scale-[0.97]
                    ${selected
                      ? 'border-[#318086] bg-[#318086]/8'
                      : 'border-stone-200 bg-white'
                    }`}
                >
                  <span className="text-xl flex-shrink-0">{cat.icon}</span>
                  <span className={`text-sm font-semibold leading-tight ${selected ? 'text-[#318086]' : 'text-brand-charcoal'}`}>
                    {cat.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom description — only when "Outro" is selected */}
        {isOutro && (
          <div>
            <label className="block text-sm font-semibold text-stone-600 mb-2">Descrição *</label>
            <input
              type="text"
              placeholder="Ex: Material de escritório…"
              value={customDescription}
              onChange={e => setCustomDescription(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-stone-600 mb-2">Data *</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-stone-600 mb-2">Valor (R$) *</label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-stone-400 text-sm font-medium">R$</span>
            <input
              type="text"
              placeholder="0,00"
              inputMode="numeric"
              value={amount}
              onChange={e => setAmount(formatAmountInput(e.target.value))}
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 text-white rounded-xl font-bold text-base active:opacity-80 disabled:opacity-50 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#6ac4b7,#318086)' }}
        >
          {loading ? 'Salvando…' : 'Registrar despesa'}
        </button>

      </form>
    </div>
  )
}
