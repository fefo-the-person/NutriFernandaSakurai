import { PatientStatus, STATUS_COLOR } from '@/lib/types'

export default function StatusBadge({ status }: { status: PatientStatus }) {
  const { bg, text, dot } = STATUS_COLOR[status] ?? STATUS_COLOR['Sem consultas']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}
