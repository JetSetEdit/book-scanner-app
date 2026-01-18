import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Libre_Baskerville } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { PWARegister } from '@/components/pwa-register'
import { ThemeProvider } from '@/components/theme-provider'
import { BetaOnboardingModal } from '@/components/beta-onboarding-modal'
import './globals.css'

const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'Subtext',
  description: 'Reveal the hidden content in every book.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Subtext',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FDFBF7',
}

import { headers, cookies } from 'next/headers'
import { isIpAllowlisted } from '@/lib/utils/rate-limiter'

// ... imports

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headerList = await headers()
  const cookieStore = await cookies()
  
  // Get IP for Admin check
  const forwarded = headerList.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const isAdmin = isIpAllowlisted(ip)
  
  // Get Cookie for VIP check
  const isVip = cookieStore.has('subtext_vip')
  
  const userMode = isAdmin ? 'admin' : (isVip ? 'vip' : 'regular')

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${libreBaskerville.variable} flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <Navbar userMode={userMode} />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <PWARegister />
          <PWAInstallPrompt />
          <BetaOnboardingModal />
          <Analytics />
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
