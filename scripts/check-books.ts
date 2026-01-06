import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
dotenv.config({ path: '.env.local' })

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, isbn')
    .limit(10)

  console.log('Books in database:')
  books?.forEach(b => {
    console.log(`  - ${b.title} (ISBN: ${b.isbn})`)
  })
}

main().catch(console.error)

