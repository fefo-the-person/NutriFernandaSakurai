'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatBRL, formatDate, CHANNEL_LABEL, type ConsultationChannel } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'

export default function DashboardPage() {
  const [loading, setLoading]               = useState(true)
  const [todayConsultations, setToday]      = useState<any[]>([])
  const [monthRevenue, setMonthRevenue]     = useState(0)
  const [activePatients, setActivePatients] = useState(0)
  const [atRiskPatients, setAtRisk]         = useState(0)

  const today      = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  useEffect(() => {
    async function load() {
      const [{ data: todayData }, { data: monthData }, { data: crmData }] = await Promise.all([
        supabase.from('consultations').select('*, patients(name)').eq('date', today).order('created_at', { ascending: false }),
        supabase.from('consultations').select('amount').gte('date', monthStart),
        supabase.from('patient_crm').select('status'),
      ])
      setToday(todayData ?? [])
      setMonthRevenue((monthData ?? []).reduce((s: number, c: any) => s + c.amount, 0))
      setActivePatients((crmData ?? []).filter((p: any) => p.status === 'Ativo').length)
      setAtRisk((crmData ?? []).filter((p: any) => p.status === 'Em risco').length)
      setLoading(false)
    }
    load()
  }, [today, monthStart])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' })

  return (
    <div className="px-4 pt-10 pb-4">
      {/* Logo header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <Image src="/logo.png" alt="Fernanda Sakurai Nutricionista" width={220} height={60}
            style={{ objectFit: 'contain', objectPosition: 'left' }} priority />
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-5">
        <p className="text-stone-500 text-sm">{greeting} 👋</p>
        <p className="text-stone-400 text-xs mt-0.5">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label={`Receita — ${monthName}`} value={formatBRL(monthRevenue)} loading={loading}
          style={{ background: 'linear-gradient(135deg,#6ac4b7,#318086)', color: 'white' }} />
        <StatCard label="Pacientes ativos" value={String(activePatients)} loading={loading}
          style={{ background: '#ffb04f20', border: '1px solid #ffb04f50' }} valueColor="#4c3a2e" />
      </div>

      {/* At-risk alert */}
      {!loading && atRiskPatients > 0 && (
        <Link href="/alertas">
          <div className="mb-5 p-4 rounded-2xl flex items-center gap-3"
               style={{ background: '#ffb04f18', border: '1px solid #ffb04f60' }}>
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#4c3a2e' }}>
                {atRiskPatients} {atRiskPatients === 1 ? 'paciente precisa' : 'pacientes precisam'} de atenção
              </p>
              <p className="text-xs mt-0.5 text-stone-500">Sem consulta há mais de 60 dias</p>
            </div>
            <svg className="w-4 h-4 ml-auto text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      )}

      {/* Today */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-brand-charcoal">Consultas hoje</h2>
        <Link href="/nova-consulta" className="text-sm font-medium" style={{ color: '#318086' }}>+ Registrar</Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-16 bg-stone-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : todayConsultations.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">Nenhuma consulta registrada hoje</p>
          <Link href="/nova-consulta"
            className="mt-4 inline-block px-5 py-2.5 text-white rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#318086' }}>
            Registrar consulta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {todayConsultations.map((c: any) => {
            const ch = CHANNEL_LABEL[c.channel as ConsultationChannel] ?? CHANNEL_LABEL['PRESENCIAL']
            return (
              <Link key={c.id} href={`/pacientes/${c.patient_id}`}>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center justify-between active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg,#6ac4b7,#318086)' }}>
                      {c.patients?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-brand-charcoal">{c.patients?.name}</p>
                      <span className={`text-xs font-medium ${ch.bg} ${ch.text} px-2 py-0.5 rounded-full`}>
                        {ch.icon} {ch.label}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: '#318086' }}>{formatBRL(c.amount)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, loading, style, valueColor }: {
  label: string; value: string; loading: boolean; style: React.CSSProperties; valueColor?: string
}) {
  return (
    <div className="rounded-2xl p-4" style={style}>
      <p className="text-xs opacity-75 mb-1 font-medium">{label}</p>
      {loading
        ? <div className="h-7 bg-white/20 rounded animate-pulse w-20" />
        : <p className="text-xl font-bold" style={valueColor ? { color: valueColor } : undefined}>{value}</p>
      }
    </div>
  )
}
