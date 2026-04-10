'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PatientCRM, Consultation, CHANNEL_LABEL, formatBRL, formatDate, formatCPF, type ConsultationChannel } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [patient, setPatient] = useState<PatientCRM | null>(null)
  const [history, setHistory] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: h }] = await Promise.all([
        supabase.from('patient_crm').select('*').eq('id', id).single(),
        supabase.from('consultations').select('*').eq('patient_id', id).order('date', { ascending: false }),
      ])
      setPatient(p as PatientCRM)
      setHistory((h ?? []) as Consultation[])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <LoadingScreen />
  if (!patient) return <div className="p-8 text-center text-stone-400">Paciente não encontrado</div>

  const waText = encodeURIComponent(
    `Olá ${patient.name.split(' ')[0]}! Tudo bem? Estou entrando em contato para verificar como você está e agendar sua próxima consulta. 😊`
  )

  // Breakdown by channel
  const onlineCount      = history.filter(c => c.channel === 'ONLINE').length
  const presencialCount  = history.filter(c => c.channel === 'PRESENCIAL').length

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 text-white" style={{ background: 'linear-gradient(135deg,#6ac4b7,#318086)' }}>
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-white/70 text-sm active:opacity-60">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold leading-tight">{patient.name}</h1>
            <p className="text-white/60 text-xs mt-1">{formatCPF(patient.cpf)}</p>
          </div>
          <StatusBadge status={patient.status} />
        </div>
      </div>

      <div className="px-4 -mt-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard label="Total faturado"     value={formatBRL(patient.total_billed)} />
          <StatCard label="Total de consultas" value={String(patient.total_consultations)} />
          <StatCard label="Ticket médio"       value={formatBRL(patient.avg_ticket)} />
          <StatCard label="Dias sem consulta"
            value={patient.days_since_last != null ? `${patient.days_since_last} d` : '—'}
            warn={patient.days_since_last != null && patient.days_since_last > 60} />
        </div>

        {/* Channel breakdown */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-stone-100 flex gap-4">
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-brand-charcoal">{presencialCount}</p>
              <p className="text-xs text-stone-400 mt-0.5">🏥 Presencial</p>
            </div>
            <div className="w-px bg-stone-100" />
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-brand-charcoal">{onlineCount}</p>
              <p className="text-xs text-stone-400 mt-0.5">💻 Online</p>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-stone-100 flex justify-between">
          <div>
            <p className="text-xs text-stone-400">Primeira consulta</p>
            <p className="text-sm font-semibold mt-0.5 text-brand-charcoal">{formatDate(patient.first_consultation)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-400">Última consulta</p>
            <p className="text-sm font-semibold mt-0.5 text-brand-charcoal">{formatDate(patient.last_consultation)}</p>
          </div>
        </div>

        {/* Notes */}
        {patient.notes && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: '#ffb04f18', border: '1px solid #ffb04f40' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#4c3a2e' }}>📝 Observações</p>
            <p className="text-sm text-stone-700">{patient.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Link href={`/nova-consulta?patient=${id}`}
            className="flex-1 py-3 text-white rounded-xl text-sm font-bold text-center active:opacity-80"
            style={{ background: 'linear-gradient(135deg,#6ac4b7,#318086)' }}>
            + Registrar consulta
          </Link>
          <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer"
            className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold active:opacity-80">
            WhatsApp
          </a>
        </div>

        {/* History */}
        <h2 className="font-bold text-brand-charcoal mb-3">Histórico de consultas</h2>
        {history.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-6">Nenhuma consulta registrada</p>
        ) : (
          <div className="space-y-2">
            {history.map(c => {
              const ch = CHANNEL_LABEL[c.channel as ConsultationChannel] ?? CHANNEL_LABEL['PRESENCIAL']
              return (
                <div key={c.id} className="bg-white rounded-xl p-3 border border-stone-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-charcoal">{formatDate(c.date)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ch.bg} ${ch.text}`}>
                      {ch.icon} {ch.label}
                    </span>
                    {c.notes && <p className="text-xs text-stone-400 mt-1 truncate max-w-[200px]">{c.notes}</p>}
                  </div>
                  <span className="font-bold text-sm" style={{ color: '#318086' }}>{formatBRL(c.amount)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm border ${warn ? 'border-amber-200' : 'bg-white border-stone-100'}`}
         style={warn ? { background: '#ffb04f18' } : {}}>
      <p className="text-xs text-stone-400">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${warn ? 'text-amber-700' : 'text-brand-charcoal'}`}>{value}</p>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="p-4 space-y-4 pt-16">
      <div className="h-32 bg-stone-100 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-stone-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )
}
