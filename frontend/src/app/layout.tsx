import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { WalletProvider } from '../contexts/WalletContext'
import { AuthProvider } from '../contexts/AuthContext'
import { SubmitProvider } from '../contexts/SubmitContext'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap'
})

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
      <body className={`${inter.className} github-layout min-h-screen text-white`} style={{ backgroundColor: '#0d1117' }}>
        <AuthProvider>
          <WalletProvider>
            <SubmitProvider>
              {children}
            </SubmitProvider>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
