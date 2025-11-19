import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import { Web3Providers } from '@/components/web3-providers'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Praxos',
  description: 'Praxos, liquidity investment layer for TradFi, operated on Rayls network.',
  icons: {
    icon: [
      {
        url: '/praxos-icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/praxos-icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Web3Providers>
            {children}
          </Web3Providers>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
