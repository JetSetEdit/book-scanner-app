import { getSupportedCountries } from '@/app/actions/access-control'
import { AccessGateForm } from '@/components/access-gate-form'
import { Metadata } from 'next'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Welcome to Subtext',
  robots: 'noindex, nofollow',
}

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ 'test-country'?: string }>
}) {
  // Get detected country from URL param or headers
  const params = await searchParams
  const headersList = headers()
  const testCountry = params?.['test-country']
  const detectedCountry = testCountry || 
    headersList.get('x-vercel-ip-country') || 
    null
  // Use fallback countries by default - will be overridden if DB query succeeds
  let countries = [
    { country_code: 'US', country_name: 'United States', allowed_count: 100 },
    { country_code: 'GB', country_name: 'United Kingdom', allowed_count: 50 },
    { country_code: 'CA', country_name: 'Canada', allowed_count: 50 },
    { country_code: 'NZ', country_name: 'New Zealand', allowed_count: 50 },
  ]

  try {
    const dbCountries = await getSupportedCountries()
    if (Array.isArray(dbCountries) && dbCountries.length > 0) {
      countries = dbCountries
    }
  } catch (error: any) {
    // Silently use fallback - error already logged in getSupportedCountries
    console.error('Welcome page: Error loading countries, using fallback:', error?.message || error)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F9F7F1] text-[#2C2416] font-sans">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#E8E5DF]">
        <div className="mb-8">
          {/* Reuse the SVG logo or a placeholder */}
          <div className="w-16 h-20 mx-auto mb-4 text-[#2C2416]">
             <svg viewBox="0 0 695.14 868.49" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <g fill="currentColor">
                  <path d="M329.96,867.3c-7.79,1.27-15.44.96-24.04.5v-162.29s23.2-.51,23.2-.51l-.97-9.31,19.12-3.75,8.72,50.05,5.75,32.19,7.91,42.33c2.88,15.42,4.95,29.94,9.19,45.93l.3-177.13,24.64.15v180.64c-8.59.06-15.59,1.14-22.57.36-3.03-.34-4.83-.64-7.79-.2l-14.73,2.22-4.79-25.4-13.92-77.96-7.03-40.06c-.48-2.75-.97-5.37-3-7.07v149.29Z"/>
                  <path d="M484.05,853.49c-8.03.87-15.09.72-24,.47l-.03-488.57c0-2.52,1.81-4.29,3.74-4.23l20.27.6.02,491.73Z"/>
                  <path d="M241.02,499.23c-8.38,1.13-15.66.98-24.03.23l-.02-481.85c8.17-.53,15.78-.56,24.04.01l.02,481.61Z"/>
                  <path d="M524.86,839.51c-8.09.88-15.64.79-23.88.25l-.56-266.19-.38-198.07,22.98-.41c.84,1.17,1.77,3.51,1.77,5.37l.06,459.04Z"/>
                  <path d="M175.53,354.98l-.02-23.22-.06-126.07-.38-169.23c0-1.61,1.39-4.46,2.73-4.43l22.04.51.05,454.21c-7.6.61-15.56.56-24.02.36l-.33-132.14Z"/>
                  <polygon points="157.86 470.93 133.86 470.68 133.89 51.3 157.86 51.55 157.86 470.93"/>
                  <path d="M495.51,266.07c-8.49,2.01-15.39,3.13-24.19,4.29l-19.48-129.06-2.95-20-5.83-39.17-5.21-33.69c-.08-.52-.04-2.41-.06-2.77-.02-.33-.38-.26-.86-.2-.32.03-.91,1.04-.91,2.19l-.07,144.62c-6.75,1.18-12.3.96-18.98.44l-.03-183.52,18.92-.14.27,25.96,14.9-2.57c2.98-.52,5.68-.65,9.12-.86l2.65,17.85,5.33,35.63,13.75,92.05,4.9,33.31,8.73,55.63Z"/>
                  <path d="M603.85,794.01l-24.06-.12v-382.34c7.69-.54,15.61-.53,24.06-.07v382.53Z"/>
                  <path d="M115.96,447.57c-8.16.76-15.77.71-24.06.19V79.49c8.24-.53,15.81-.53,24.05,0v368.09Z"/>
                  <path d="M560.79,819.5c-6.41,1-12.58.87-18.9.41l-.02-430.57,18.89-.12.03,430.28Z"/>
                  <path d="M307.62,165.5l-3.16,15.44-23.71-4.62,12.09-63.32,8.11-41.73,5.63-29.17,3.72-20.19c7.42.18,13.84,1.78,22.35,3.74l.32-25.64,24,.18-.02,175.93c-8.32.21-15.68.45-24.12-.43V40.79c0-.69-1.3-2.03-1.35-1.71l-.34,2.1-4.83,26.12-8.42,44.62-5.59,29.27-4.68,24.3Z"/>
                  <path d="M644.84,757.66l-24.01.31v-316.52s11.52-.97,11.52-.97c5.05,3.14,8.98,7.04,12.5,12.01v305.17Z"/>
                  <path d="M74.42,169.6l-.26,23.21-.08,217.16c-8.22.29-15.65.34-24.01-.3l-.02-285.22c0-1.43,1.83-4.22,2.95-4.22l18.72-.02c1.3,0,3.13,2.87,3.12,4l-.3,28.79-.11,16.58Z"/>
                  <polygon points="404.91 175.93 369.04 176.04 369.05 1.14 404.89 1.27 404.91 175.93"/>
                  <path d="M292.15,716.2l-.12,146.94h-35.1s.01-178.61.01-178.61l35.08-.38c1.9,11.13.13,21.01.13,32.05Z"/>
                  <path d="M695.13,602.09c-.11,25.27-2.37,45.59-9.08,69.94-5.15,18.68-11.66,36.28-22.43,53.36-1-4.92-1.61-9.22-1.6-14.49l.23-234.49c13.64,17.32,19.32,37.09,24.95,56.48,6.6,22.7,8.03,45.56,7.93,69.2Z"/>
                  <path d="M200.06,839.82l-20.31.46c-1.74.04-3.74-2.14-3.74-4.32l.03-237.56,23.99-.34.03,241.77Z"/>
                  <path d="M241.06,853.66l-24,.36-.04-211.1c7.61-2.18,15.72-2.25,24.02-.86l.03,211.6Z"/>
                  <path d="M370.98,537.34l-.61-41.5-.23-97.58c0-2.26.79-5.14,1.3-7.17l33.59.12v145.8s-34.05.34-34.05.34Z"/>
                  <polygon points="118.11 798.13 93.17 797.97 93.19 611.51 93.98 598.08 117.98 598.06 118.09 791.92 118.11 798.13"/>
                  <path d="M443.85,860.8c-8.45.6-16.25.56-24.78.1l-.03-189.64c0-2.86,2.25-4.34,4.75-4.26l19.98.62.08,193.18Z"/>
                  <path d="M555.8,265.19c0,1.79-.63,3.71-1.34,4.06-.9.44-3.25.98-4.44.94l-18.14-.64-.02-200.09,23.88-.14.06,195.87Z"/>
                  <path d="M356.9,528.62c-8.47.53-16.16.56-24.1-.11l.02-193.13,9.03-.68c5.25-.4,10.31-.67,15.05,1.11v192.81Z"/>
                  <path d="M518.83,269.16c-6.7,1.26-12.36,1.13-18.94.43V29.21c6.54-.28,12.36-.26,18.94.22v239.72Z"/>
                  <path d="M443.46,414.14l.39,140.44c-8.15.71-16.08.65-24.8.22l.04-179.47,23.79-.11.58,38.92Z"/>
                  <path d="M32.72,379.1C3.12,330.07,1.29,258.69,15.21,205.56c3.99-15.21,8.42-29.87,17.55-43.32l-.05,216.86Z"/>
                  <polygon points="603.85 238.9 568.83 239.11 568.86 129.36 603.69 129.28 603.85 238.9"/>
                  <path d="M315.98,520.41c-6.5.33-18.98,3.12-18.98-3.42l.08-194.59c7.37-.34,12.31-.34,18.87.08l.02,197.93Z"/>
                  <path d="M37.69,733.25c-16.14-22.46-25.01-46.71-30.95-71.99-2.43-11.21-4.31-21.82-5.1-33.15-1.22-10.08-2.07-19.29-1.41-30.01l37.65.06-.18,135.09Z"/>
                  <polygon points="77.08 761.9 52.97 761.84 52.95 614.47 77.04 614.41 77.08 761.9"/>
                  <path d="M275.87,193.28c-6.73,1.1-12.08,1.03-18.91.16V8.55c6.65-.43,12.27-.43,18.88,0l.03,184.72Z"/>
                  <path d="M634.93,269.32c-6.89,1-12,.94-18.98.15l-.05-153.37c6.35-1.19,12.2-1.1,19-.41l.03,153.63Z"/>
                  <path d="M663.94,270.96c-1.12-3.27-1.83-5.81-2.48-8.52l-5.22-21.9-4.05-17.86-9.53-39.41c-2.03-8.4-4.08-16.35-5.07-24.78l22.59-5.73,15.61,64.45,10.92,46.18c.35,1.62-4.3,3.33-6.03,3.73l-16.75,3.84Z"/>
                  <path d="M603.8,84.42l.06,16.99c0,1.64-1.99,3.64-3.74,3.63l-31.19-.17.02-23.48,31.2-.23c1.15,0,3.64,1.83,3.65,3.27Z"/>
                  <path d="M603.89,265.99c0,2.04-1.92,4.16-3.77,4.15l-31.08-.28-.22-23.41,31.31-.32c1.66-.02,3.75,2.22,3.75,3.72l.03,16.14Z"/>
                  <path d="M404.97,382.88l-34.34.17c-.78-8.02-.74-14.95.16-23.02h34.17s0,22.85,0,22.85Z"/>
                  <path d="M602.73,121.97l-32.52-.04c-1.97-2.53-1.94-7.26-.55-9.83l32.86.02c1.67,3.04,1.63,6.08.21,9.85Z"/>
                </g>
              </svg>
          </div>
          <h1 className="font-serif text-3xl mb-2 text-[#2C2416]">Subtext International</h1>
          <p className="text-[#4A4A4A] mb-2">
            Subtext is currently in beta for Australian users.
          </p>
          <p className="text-[#4A4A4A]">
            We are opening limited spots for international readers.
          </p>
        </div>

        <AccessGateForm countries={countries} defaultCountry={detectedCountry || undefined} />
      </div>
    </div>
  )
}
