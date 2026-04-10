import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

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
        <main className="max-w-lg mx-auto min-h-screen pb-safe">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
