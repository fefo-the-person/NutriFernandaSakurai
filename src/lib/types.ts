export type PatientStatus = 'Ativo' | 'Em risco' | 'Inativo' | 'Sem consultas'
export type ConsultationChannel = 'ONLINE' | 'PRESENCIAL'

export interface Patient {
  id: string
  cpf: string | null
  name: string
  notes: string | null
  created_at: string
}

export interface PatientCRM extends Patient {
  first_consultation: string | null
  last_consultation: string | null
  total_consultations: number
  total_billed: number
  avg_ticket: number
  days_since_last: number | null
  status: PatientStatus
}

export interface Consultation {
  id: string
  patient_id: string
  date: string
  amount: number
  channel: ConsultationChannel
  notes: string | null
  created_at: string
}

export interface Expense {
  id: string
  date: string
  category: string | null
  description: string
  amount: number
  created_at: string
}

export interface MonthlySummary {
  month: string
  revenue: number
  consultation_count: number
  expenses_total: number
  net_income: number
}

// Brand colours
export const BRAND = {
  cream:    '#fbf5f0',
  teal:     '#318086',
  tealLight:'#6ac4b7',
  amber:    '#ffb04f',
  pink:     '#ffb8ad',
  charcoal: '#3a3a3a',
}

export const STATUS_COLOR: Record<PatientStatus, { bg: string; text: string; dot: string }> = {
  'Ativo':         { bg: 'bg-teal-100',   text: 'text-teal-800',   dot: 'bg-teal-500' },
  'Em risco':      { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-400' },
  'Inativo':       { bg: 'bg-rose-100',   text: 'text-rose-700',   dot: 'bg-rose-400' },
  'Sem consultas': { bg: 'bg-stone-100',  text: 'text-stone-500',  dot: 'bg-stone-400' },
}

export const CHANNEL_LABEL: Record<ConsultationChannel, { label: string; icon: string; bg: string; text: string }> = {
  'PRESENCIAL': { label: 'Presencial', icon: '🏥', bg: 'bg-teal-50',   text: 'text-teal-700' },
  'ONLINE':     { label: 'Online',     icon: '💻', bg: 'bg-violet-50', text: 'text-violet-700' },
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

export function formatCPF(cpf: string | null): string {
  if (!cpf) return 'CPF não informado'
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
