import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: 'Subtext',
    short_name: 'Subtext',
    description: 'Reveal the hidden content in every book. Scan books to get detailed content warnings and age ratings.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDFBF7',
    theme_color: '#FDFBF7',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo_var_2.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/logo-lockup.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['books', 'education', 'utilities'],
    shortcuts: [
      {
        name: 'Scan Book',
        short_name: 'Scan',
        description: 'Scan a book barcode',
        url: '/scan',
        icons: [{ src: '/logo.png', sizes: '96x96' }],
      },
      {
        name: 'Bookshelf',
        short_name: 'Books',
        description: 'View your scanned books',
        url: '/collection',
        icons: [{ src: '/logo.png', sizes: '96x96' }],
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  })
}






