import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import HydrationSafe from '@/components/HydrationSafe'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Player Stock - NFL Player Token Trading',
  description: 'Trade tokens representing NFL players on Hyperliquid',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <div className="min-h-screen bg-gray-50">
          <HydrationSafe>
            <Header />
            <main>
              {children}
            </main>
          </HydrationSafe>
        </div>
      </body>
    </html>
  )
} 