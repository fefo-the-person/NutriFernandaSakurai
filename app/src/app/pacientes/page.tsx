'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PatientCRM, PatientStatus, formatBRL, formatDate } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'

const FILTERS: { label: string; value: PatientStatus | 'Todos' }[] = [
  { label: 'Todos',    value: 'Todos' },
  { label: 'Ativos',   value: 'Ativo' },
  { label: 'Em risco', value: 'Em risco' },
  { label: 'Inativos', value: 'Inativo' },
]

export default function PacientesPage() {
  const [patients, setPatients] = useState<PatientCRM[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<PatientStatus | 'Todos'>('Todos')

  useEffect(() => {
    supabase.from('patient_crm').select('*')
      .order('last_consultation', { ascending: false, nullsFirst: false })
      .then(({ data }) => { setPatients((data ?? []) as PatientCRM[]); setLoading(false) })
  }, [])

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.cpf ?? '').includes(search)
    const matchFilter = filter === 'Todos' || p.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="px-4 pt-12 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-bold text-brand-charcoal">Pacientes</h1>
        <Link href="/pacientes/novo"
          className="px-4 py-2 text-white rounded-xl text-sm font-semibold active:opacity-80"
          style={{ backgroundColor: '#318086' }}>
          + Novo
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input type="search" placeholder="Buscar por nome ou CPF…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#318086]/40 focus:border-[#318086]" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === f.value ? 'text-white' : 'bg-white text-stone-500 border border-stone-200'}`}
            style={filter === f.value ? { backgroundColor: '#318086' } : {}}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-stone-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">Nenhum paciente encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <Link key={p.id} href={`/pacientes/${p.id}`}>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                         style={{ background: 'linear-gradient(135deg,#b3dad7,#318086)' }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-brand-charcoal truncate">{p.name}</p>
                      <p className="text-stone-400 text-xs mt-0.5">
                        {p.total_consultations} {p.total_consultations === 1 ? 'consulta' : 'consultas'} · {formatBRL(p.total_billed)}
                      </p>
                      {p.last_consultation && (
                        <p className="text-stone-400 text-xs">Última: {formatDate(p.last_consultation)}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
