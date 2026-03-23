import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MenuFlow',
  description: 'Plataforma de cardápio digital',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
