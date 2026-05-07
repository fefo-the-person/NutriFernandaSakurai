'use client'
import { useRouter } from 'next/navigation'

export default function NovoRegistroPage() {
  const router = useRouter()

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="font-display text-2xl font-bold text-brand-charcoal mb-2">Novo registro</h1>
      <p className="text-sm text-stone-400 mb-8">O que você quer registrar?</p>

      <div className="space-y-4">

        {/* Consulta */}
        <button
          onClick={() => router.push('/nova-consulta')}
          className="w-full text-left rounded-2xl p-5 text-white active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg,#6ac4b7,#318086)' }}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">🩺</span>
            <div>
              <p className="font-bold text-lg leading-tight">Consulta</p>
              <p className="text-sm opacity-70 mt-0.5">Registrar atendimento com paciente</p>
            </div>
            <span className="ml-auto opacity-50 text-xl">›</span>
          </div>
        </button>

        {/* Despesa */}
        <button
          onClick={() => router.push('/nova-despesa')}
          className="w-full text-left rounded-2xl p-5 bg-white border border-stone-200 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">💸</span>
            <div>
              <p className="font-bold text-lg leading-tight text-brand-charcoal">Despesa</p>
              <p className="text-sm text-stone-400 mt-0.5">Registrar um gasto ou custo</p>
            </div>
            <span className="ml-auto text-stone-300 text-xl">›</span>
          </div>
        </button>

      </div>
    </div>
  )
}
