'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from './BottomNav'

const PUBLIC_ROUTES = ['/login']

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [checking, setChecking]           = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  const isPublic = PUBLIC_ROUTES.includes(pathname)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthenticated(true)
        if (pathname === '/login') router.replace('/')
      } else {
        setAuthenticated(false)
        if (!isPublic) router.replace('/login')
      }
      setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthenticated(true)
      } else {
        setAuthenticated(false)
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#318086] border-t-transparent animate-spin" />
          <p className="text-stone-400 text-sm">Carregando…</p>
        </div>
      </div>
    )
  }

  if (isPublic) {
    return <>{children}</>
  }

  if (!authenticated) return null

  return (
    <>
      <main className="max-w-lg mx-auto min-h-screen pb-safe">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
