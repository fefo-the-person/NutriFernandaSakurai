import type { Metadata, Viewport } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'Fernanda Sakurai · Nutricionista',
  description: 'Gestão de pacientes e consultas',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NutriFS',
  },
}

export const viewport: Viewport = {
  themeColor: '#318086',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {/*
          AuthProvider handles:
          - Session checking on load
          - Redirecting unauthenticated users to /login
          - Rendering BottomNav only for authenticated users
          - Keeping /login as a public route
        */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
