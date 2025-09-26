import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BountyHub - Secure Rewards for Open Source Contributors',
  description: 'A secure bounty rewards platform connecting open source contributors with meaningful projects and fair compensation.',
  keywords: ['bounty', 'open source', 'blockchain', 'rewards', 'contributors', 'ethereum'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <body className={`${inter.className} bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 min-h-screen text-white`}>
        {children}
      </body>
    </html>
  )
}
