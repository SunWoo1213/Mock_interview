import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import AuthProviderComponent from '@/components/AuthProvider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'AI 취업 준비 서비스',
  description: 'AI 기반 자기소개서 피드백 및 모의 면접 서비스',
  icons: {
    icon: '/icon',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="bg-zinc-50 text-zinc-900 min-h-screen antialiased font-sans">
        <AuthProvider>
          <AuthProviderComponent>{children}</AuthProviderComponent>
        </AuthProvider>
      </body>
    </html>
  )
}

