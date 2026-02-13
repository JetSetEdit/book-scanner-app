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
import { AestheticThemeApplicator } from '@/components/aesthetic-theme-applicator'
import { BetaOnboardingModal } from '@/components/beta-onboarding-modal'
import { getVariantConfig } from '@/lib/config/variants'
import { headers, cookies } from 'next/headers'
import { isIpAllowlisted } from '@/lib/utils/rate-limiter'
import './globals.css'

const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-serif',
})

const _vMeta = getVariantConfig().meta
export const metadata: Metadata = {
  title: _vMeta.title,
  description: _vMeta.description,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: _vMeta.title,
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
  themeColor: '#F6F1EB', /* BookTok parchment */
}

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

  // Hide navbar/footer on landing pages (homepage, login) for regular users
  const currentPath = headerList.get('x-pathname') || '/'
  const isLandingPage = currentPath === '/' || currentPath === '/login'
  const showChrome = !isLandingPage || userMode !== 'regular'

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${libreBaskerville.variable} flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AestheticThemeApplicator />
          {showChrome && <Navbar userMode={userMode} />}
          <main className={showChrome ? "flex-1 pb-16 md:pb-0" : "flex-1"}>
            {children}
          </main>
          {showChrome && <Footer />}
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
