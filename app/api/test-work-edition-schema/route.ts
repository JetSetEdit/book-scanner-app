import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    console.log('Testing Work → Edition → Identifier schema creation...')
    
    // Test creating a simple work
    const { data: testWork, error: workError } = await supabaseAdmin
      .from('works')
      .insert({
        canonical_title: 'Test Book',
        primary_contributors: [{ role: 'author', name: 'Test Author' }],
        language_work: 'en'
      })
      .select('id, work_fp')
      .single()
    
    if (workError) {
      console.error('Work creation failed:', workError)
      return NextResponse.json({
        success: false,
        error: 'Work creation failed',
        details: workError.message
      }, { status: 500 })
    }
    
    console.log('Test work created:', testWork)
    
    // Test creating an edition
    const { data: testEdition, error: editionError } = await supabaseAdmin
      .from('editions')
      .insert({
        work_id: testWork.id,
        publisher: 'Test Publisher',
        pub_year: 2024,
        binding: 'paperback',
        language_edition: 'en'
      })
      .select('id, edition_fp')
      .single()
    
    if (editionError) {
      console.error('Edition creation failed:', editionError)
      return NextResponse.json({
        success: false,
        error: 'Edition creation failed',
        details: editionError.message
      }, { status: 500 })
    }
    
    console.log('Test edition created:', testEdition)
    
    // Test creating an identifier
    const { data: testIdentifier, error: identifierError } = await supabaseAdmin
      .from('identifiers')
      .insert({
        edition_id: testEdition.id,
        id_type: 'isbn13',
        value: '9781234567890',
        is_primary: true,
        source: 'manual'
      })
      .select('id')
      .single()
    
    if (identifierError) {
      console.error('Identifier creation failed:', identifierError)
      return NextResponse.json({
        success: false,
        error: 'Identifier creation failed',
        details: identifierError.message
      }, { status: 500 })
    }
    
    console.log('Test identifier created:', testIdentifier)
    
    // Clean up test data
    await supabaseAdmin.from('identifiers').delete().eq('id', testIdentifier.id)
    await supabaseAdmin.from('editions').delete().eq('id', testEdition.id)
    await supabaseAdmin.from('works').delete().eq('id', testWork.id)
    
    return NextResponse.json({
      success: true,
      message: 'Work → Edition → Identifier schema is working correctly',
      testData: {
        workId: testWork.id,
        workFp: testWork.work_fp,
        editionId: testEdition.id,
        editionFp: testEdition.edition_fp,
        identifierId: testIdentifier.id
      }
    })
    
  } catch (error) {
    console.error('Error testing Work → Edition → Identifier schema:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test Work → Edition → Identifier schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

