import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { WalletProvider } from '../contexts/WalletContext'
import { AuthProvider } from '../contexts/AuthContext'

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
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} enhanced-bg min-h-screen text-white`}>
        <AuthProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
